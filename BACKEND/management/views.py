# management/views.py

import random
from django.utils import timezone
from django.db import transaction # <--- ¡ESTA ES LA IMPORTACIÓN CLAVE QUE FALTABA O ESTABA INCORRECTA!
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter
import django_filters
from django.db import transaction
from .models import Order, SaleRecord, SaleItemRecord


from .models import User, Product, Promotion, Table, Order, OrderDetail
from .serializers import (
    UserSerializer,
    ProductSerializer,
    PromotionSerializer,
    TableSerializer,
    OrderSerializer,
    OrderDetailSerializer
)
from .filters import ProductFilter

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_class = ProductFilter
    filter_backends = [SearchFilter, django_filters.rest_framework.DjangoFilterBackend]
    search_fields = ['name', 'description']

class PromotionViewSet(viewsets.ModelViewSet):
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class TableViewSet(viewsets.ModelViewSet):
    queryset = Table.objects.all().order_by('number')
    serializer_class = TableSerializer
    # Permiso por defecto para la mayoría de las acciones
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        """
        Permite el acceso público para ver la lista de mesas y su detalle.
        Otras acciones como crear, modificar o generar códigos requieren autenticación.
        """
        # Si la acción es 'list' o 'retrieve', permite el acceso a cualquiera.
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [permissions.AllowAny]

        # Para el resto de acciones ('create', 'update', 'destroy', 'generate_code'),
        # se usarán los permisos por defecto de la clase (IsAuthenticated).
        return super().get_permissions()

    @action(detail=True, methods=['post'], url_path='generate-code')
    def generate_code(self, request, pk=None):
        """
        Genera un código de 4 dígitos para la mesa.
        Requiere autenticación (acción para el personal).
        """
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
        """
        Valida un código de mesa ingresado por un cliente.
        Esta acción es pública.
        """
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

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer

    def get_permissions(self):
        """
        Permite acceso anónimo para 'create' (crear pedido) y 'get_by_token'.
        Las demás acciones requieren autenticación.
        """
        # CORRECCIÓN: Añadimos 'get_by_token' a la lista de acciones públicas
        if self.action in ['create', 'get_by_token']:
            self.permission_classes = [permissions.AllowAny]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()

    # El método create no cambia
    def create(self, request, *args, **kwargs):
        write_serializer = self.get_serializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        details_data = write_serializer.validated_data.pop('details')
        customer_name_data = write_serializer.validated_data.pop('customer_name', None)
        try:
            with transaction.atomic():
                order = Order.objects.create(
                    customer_name=customer_name_data,
                    **write_serializer.validated_data
                )
                total_order_price = 0
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
                order.total = total_order_price
                order.status = 'pending'
                order.save()
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        read_serializer = self.get_serializer(order)
        headers = self.get_success_headers(read_serializer.data)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    # La acción confirm_order no cambia
    @action(detail=True, methods=['post'], url_path='confirm')
    def confirm_order(self, request, pk=None):
        order = self.get_object()
        if order.status != 'pending':
            return Response(
                {'error': f'Este pedido ya está en estado "{order.status}" y no puede ser confirmado de nuevo.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        order.status = 'confirmed'
        order.save()
        serializer = self.get_serializer(order)
        return Response(serializer.data)

    # La acción get_by_token no cambia
    @action(detail=False, methods=['get'], url_path='by-token', permission_classes=[permissions.AllowAny])
    def get_by_token(self, request):
        token_from_url = request.query_params.get('token', None)
        if not token_from_url:
            return Response(
                {'error': 'Se requiere el parámetro "token" en la URL.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            order = Order.objects.get(view_token=token_from_url)
        except (Order.DoesNotExist, ValueError):
            return Response(
                {'error': 'Pedido no encontrado o token inválido.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = self.get_serializer(order)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='prepare', permission_classes=[permissions.IsAuthenticated])
    def mark_as_preparing(self, request, pk=None):
        """
        Permite al personal marcar un pedido como 'En preparación'.
        El pedido debe estar previamente en estado 'confirmado'.
        """
        order = self.get_object() # Obtiene el pedido por su PK (ID) de la URL

        if order.status != 'confirmed':
            return Response(
                {'error': f'El pedido debe estar en estado "confirmado" para marcarlo como "en preparación". Estado actual: {order.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = 'preparing' # Cambiamos el estado
        order.save()               # Guardamos el cambio en la base de datos

        serializer = self.get_serializer(order) # Devolvemos el pedido actualizado
        return Response(serializer.data)
    # --- NUEVA ACCIÓN PARA MARCAR PEDIDO COMO "ENTREGADO" ---
    @action(detail=True, methods=['post'], url_path='deliver', permission_classes=[permissions.IsAuthenticated])
    def mark_as_delivered(self, request, pk=None):
        """
        Permite al personal marcar un pedido como 'Entregado'.
        El pedido debe estar previamente en estado 'en preparación'.
        """
        order = self.get_object() # Obtiene el pedido por su PK (ID)

        if order.status != 'preparing':
            return Response(
                {'error': f'El pedido debe estar en estado "en preparación" para marcarlo como "entregado". Estado actual: {order.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = 'delivered' # Cambiamos el estado
        order.save()               # Guardamos el cambio en la base de datos

        serializer = self.get_serializer(order) # Devolvemos el pedido actualizado
        return Response(serializer.data)
    # --- NUEVA ACCIÓN PARA MARCAR PEDIDO COMO "PAGADO" ---
    @action(detail=True, methods=['post'], url_path='pay', permission_classes=[permissions.IsAuthenticated])
    def mark_as_paid(self, request, pk=None):
        order = self.get_object()

        if order.status != 'delivered': # O la lógica que hayas definido
            return Response(
                {'error': f'El pedido debe estar en estado "entregado" para marcarlo como "pagado". Estado actual: {order.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = 'paid'
        order.paid_at = timezone.now() # <-- AÑADIMOS ESTA LÍNEA para registrar la hora del pago
        order.save()               

        serializer = self.get_serializer(order)
        return Response(serializer.data)
    # --- NUEVA ACCIÓN PARA ANULAR UN PEDIDO ---
    @action(detail=True, methods=['post'], url_path='annul', permission_classes=[permissions.IsAuthenticated])
    def annul_order(self, request, pk=None):
        """
        Permite al personal anular un pedido.
        Por defecto, solo se puede anular si está 'pendiente' o 'confirmado'.
        """
        order = self.get_object()

        # VALIDACIÓN: ¿Desde qué estado se puede anular?
        allowed_statuses_to_annul = ['pending', 'confirmed']
        if order.status not in allowed_statuses_to_annul:
            return Response(
                {'error': f'El pedido solo se puede anular si está en estado "pendiente" o "confirmado". Estado actual: {order.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # NOTA: En un sistema más complejo, aquí podría ir lógica adicional, 
        # como devolver los productos del pedido al inventario.
        # Por ahora, solo cambiaremos el estado.

        order.status = 'annulled'
        order.save()

        serializer = self.get_serializer(order)
        return Response(serializer.data)
    

class OrderDetailViewSet(viewsets.ModelViewSet):
    queryset = OrderDetail.objects.all()
    serializer_class = OrderDetailSerializer
    permission_classes = [permissions.IsAuthenticated]