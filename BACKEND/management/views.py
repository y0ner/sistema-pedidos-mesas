# management/views.py

import random
from django.utils import timezone
from rest_framework import viewsets, permissions, status # <--- ¡LA CORRECCIÓN ESTÁ AQUÍ!
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction # ¡Importante para transacciones atómicas!

from .models import User, Product, Promotion, Table, Order, OrderDetail
from .serializers import (
    UserSerializer,
    ProductSerializer,
    PromotionSerializer,
    TableSerializer,
    OrderSerializer,
    OrderDetailSerializer
)

# ViewSet para el modelo User
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

# ViewSet para el modelo Product
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

# ViewSet para el modelo Promotion
class PromotionViewSet(viewsets.ModelViewSet):
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

# ViewSet para el modelo Table
class TableViewSet(viewsets.ModelViewSet):
    queryset = Table.objects.all().order_by('number')
    serializer_class = TableSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='generate-code')
    def generate_code(self, request, pk=None):
        table = self.get_object()
        while True:
            new_code = str(random.randint(1000, 9999))
            if not Table.objects.filter(current_code=new_code).exists():
                break
        table.current_code = new_code
        table.last_code_update = timezone.now()
        table.save()
        serializer = self.get_serializer(table)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='validate-code', permission_classes=[permissions.AllowAny])
    def validate_code(self, request):
        code = request.data.get('code', None)
        if not code:
            return Response(
                {'error': 'Se requiere el campo "code" en el cuerpo de la petición.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            table = Table.objects.get(current_code=code, status='available')
        except Table.DoesNotExist:
            return Response(
                {'error': 'Código de mesa inválido o la mesa ya no está disponible.'},
                status=status.HTTP_404_NOT_FOUND
            )
        table.status = 'occupied'
        table.current_code = None
        table.save()
        serializer = self.get_serializer(table)
        return Response(serializer.data, status=status.HTTP_200_OK)

# ViewSet para el modelo Order (ACTUALIZADO)
class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Sobrescribimos el método 'create' para manejar la lógica personalizada
    def create(self, request, *args, **kwargs):
        # Usamos un serializer de escritura para validar los datos de entrada
        write_serializer = OrderSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)

        details_data = write_serializer.validated_data.pop('details')
        
        try:
            # Usamos una transacción para asegurar la integridad de los datos.
            # Si algo falla al crear los detalles, no se creará el pedido.
            with transaction.atomic():
                # Crear el objeto Order
                order = Order.objects.create(**write_serializer.validated_data)
                
                total_order_price = 0
                
                # Crear los objetos OrderDetail
                for detail_data in details_data:
                    product = Product.objects.get(id=detail_data['product_id'])
                    subtotal = product.price * detail_data['quantity']
                    
                    OrderDetail.objects.create(
                        order=order,
                        product=product,
                        quantity=detail_data['quantity'],
                        subtotal=subtotal
                    )
                    total_order_price += subtotal
                
                # Actualizar el total del pedido
                order.total = total_order_price
                # Establecer el estado inicial según tu flujo
                order.status = 'pending'
                order.save()

        except Exception as e:
            # Si hay algún error, devolver una respuesta de error
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # Devolver la respuesta usando el serializer de lectura para mostrar el objeto creado
        read_serializer = OrderSerializer(order)
        headers = self.get_success_headers(read_serializer.data)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    # --- ¡NUEVA ACCIÓN PARA CONFIRMAR PEDIDO! ---
    @action(detail=True, methods=['post'], url_path='confirm')
    def confirm_order(self, request, pk=None):
        """
        Confirma un pedido que está en estado 'pending'.
        Esta acción debe ser llamada por un usuario autenticado (personal del restaurante).
        """
        order = self.get_object()

        # 1. Verificamos que el pedido esté realmente pendiente
        if order.status != 'pending':
            return Response(
                {'error': f'Este pedido ya está en estado "{order.status}" y no puede ser confirmado de nuevo.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Opcional: Si en el futuro quieres añadir más lógica, como
        #    guardar el nombre del cliente o añadir productos, iría aquí.
        #    Por ejemplo, para guardar el nombre del cliente:
        #    customer_name = request.data.get('customer_name')
        #    if customer_name:
        #        order.customer_name = customer_name  # (Esto requeriría añadir el campo al modelo Order)

        # 3. Cambiamos el estado del pedido
        order.status = 'confirmed'
        order.save()

        # 4. Devolvemos los datos del pedido actualizado
        serializer = self.get_serializer(order)
        return Response(serializer.data)

# ViewSet para el modelo OrderDetail
class OrderDetailViewSet(viewsets.ModelViewSet):
    queryset = OrderDetail.objects.all()
    serializer_class = OrderDetailSerializer
    permission_classes = [permissions.IsAuthenticated]