# management/views.py
import random
from django.utils import timezone
from django.db import transaction # Solo necesitas una importación de transaction
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter
import django_filters
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet 
from datetime import date
from django.db.models import Sum
from rest_framework.decorators import api_view, permission_classes # Asegúrate de tener api_view

# Asegúrate que SaleRecord y SaleItemRecord estén importados
from .models import User, Product, Promotion, Table, Order, OrderDetail, SaleRecord, SaleItemRecord
from .serializers import (
    UserSerializer,
    ProductSerializer,
    PromotionSerializer,
    TableSerializer,
    OrderSerializer,
    OrderDetailSerializer,
    SaleRecordSerializer  # <--- AÑADE ESTA LÍNEA
)
from .filters import ProductFilter

# UserViewSet, ProductViewSet, PromotionViewSet y TableViewSet no cambian...
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
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [permissions.AllowAny]
        return super().get_permissions()

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


# --- OrderViewSet ACTUALIZADO ---
class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer

    def get_permissions(self):
        if self.action in ['create', 'get_by_token']:
            self.permission_classes = [permissions.AllowAny]
        else:
            # Para update, partial_update, etc., requerimos autenticación.
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        # Este método no cambia, lo dejamos como está
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

    # --- MÉTODO NUEVO PARA MODIFICAR PEDIDOS ---
    def update(self, request, *args, **kwargs):
        """
        Permite modificar un pedido, pero solo si su estado es 'pending'.
        Esto es para que el mesero pueda ajustar el pedido antes de confirmarlo.
        """
        order = self.get_object() # Obtenemos la instancia del pedido a modificar

        # 1. Validación clave: solo modificar si el estado es 'pending'
        if order.status != 'pending':
            return Response(
                {'error': f'Solo se pueden modificar pedidos en estado "pendiente". Estado actual: {order.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        write_serializer = self.get_serializer(order, data=request.data)
        write_serializer.is_valid(raise_exception=True)
        details_data = write_serializer.validated_data.pop('details')
        
        try:
            with transaction.atomic():
                # 2. Eliminar los detalles antiguos del pedido
                order.details.all().delete()

                # 3. Re-crear los detalles con la nueva información y recalcular el total
                new_total_price = 0
                for detail_data in details_data:
                    product = Product.objects.get(id=detail_data['product_id'])
                    subtotal = product.price * detail_data['quantity']
                    OrderDetail.objects.create(
                        order=order,
                        product=product,
                        quantity=detail_data['quantity'],
                        subtotal=subtotal
                    )
                    new_total_price += subtotal

                # 4. Actualizar el pedido con el nuevo total y otros datos
                order.total = new_total_price
                # Actualizamos también el nombre del cliente si se envía
                order.customer_name = write_serializer.validated_data.get('customer_name', order.customer_name)
                order.save()

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Devolvemos el pedido actualizado
        read_serializer = self.get_serializer(order)
        return Response(read_serializer.data, status=status.HTTP_200_OK)

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
        order = self.get_object()
        if order.status != 'confirmed':
            return Response(
                {'error': f'El pedido debe estar en estado "confirmado" para marcarlo como "en preparación". Estado actual: {order.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        order.status = 'preparing'
        order.save()
        serializer = self.get_serializer(order)
        return Response(serializer.data)
      
    @action(detail=True, methods=['post'], url_path='annul', permission_classes=[permissions.IsAuthenticated])
    def annul_order(self, request, pk=None):
        order = self.get_object()
        allowed_statuses_to_annul = ['pending', 'confirmed']
        if order.status not in allowed_statuses_to_annul:
            return Response(
                {'error': f'El pedido solo se puede anular si está en estado "pendiente" o "confirmado". Estado actual: {order.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        order.status = 'annulled'
        order.save()
        serializer = self.get_serializer(order)
        return Response(serializer.data)
    # El resto de las acciones (confirm_order, get_by_token, etc.) no cambian
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

# --- ACCIÓN NUEVA ---
    @action(detail=True, methods=['post'], url_path='ready', permission_classes=[permissions.IsAuthenticated])
    def mark_as_ready(self, request, pk=None):
        """
        Permite al personal de cocina marcar un pedido como 'Listo para Entregar'.
        El pedido debe estar previamente en estado 'en preparación'.
        """
        order = self.get_object()
        if order.status != 'preparing':
            return Response(
                {'error': f'El pedido debe estar "en preparación" para marcarlo como "listo para entregar". Estado actual: {order.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        order.status = 'ready_to_deliver'
        order.save()
        serializer = self.get_serializer(order)
        return Response(serializer.data)
    
    # --- ACCIÓN MODIFICADA ---
    @action(detail=True, methods=['post'], url_path='deliver', permission_classes=[permissions.IsAuthenticated])
    def mark_as_delivered(self, request, pk=None):
        """
        Permite al mesero marcar un pedido como 'Entregado'.
        El pedido ahora debe estar previamente en estado 'listo para entregar'.
        """
        order = self.get_object()
        # MODIFICACIÓN: Ahora validamos contra 'ready_to_deliver'
        if order.status != 'ready_to_deliver':
            return Response(
                {'error': f'El pedido debe estar "listo para entregar" para marcarlo como "entregado". Estado actual: {order.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        order.status = 'delivered'
        order.save()
        serializer = self.get_serializer(order)
        return Response(serializer.data)

    # He unido tu lógica con la mía. Uso tu url_path `pay` y he añadido el decorador @transaction.atomic.
    @action(detail=True, methods=['post'], url_path='pay', permission_classes=[permissions.IsAuthenticated])
    @transaction.atomic # <-- Garantiza que todas las operaciones de DB se hagan o no se haga ninguna.
    def mark_as_paid(self, request, pk=None):
        order = self.get_object()

        if order.status != 'delivered':
            return Response(
                {'error': f'El pedido debe estar en estado "entregado" para marcarlo como "pagado". Estado actual: {order.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Actualizar el pedido (esto ya lo tenías)
        order.status = 'paid'
        order.paid_at = timezone.now()
        order.save()

        # 2. Crear el registro de venta principal (SaleRecord)
        sale_record = SaleRecord.objects.create(
            order=order,
            total_amount=order.total,
            processed_by=request.user # Guardamos qué usuario admin procesó la venta
        )

        # 3. Crear los detalles de la venta (SaleItemRecord) a partir de los OrderDetail
        order_details = order.details.all()
        items_to_create = []
        for detail in order_details:
            items_to_create.append(
                SaleItemRecord(
                    sale_record=sale_record,
                    product_name=detail.product.name,
                    product_price_at_sale=detail.product.price, # Tomamos el precio del producto en ese momento
                    quantity=detail.quantity,
                    subtotal=detail.subtotal
                )
            )
        
        # Creamos todos los items en una sola consulta para mayor eficiencia
        SaleItemRecord.objects.bulk_create(items_to_create)

        # Usamos el serializer de Order, ya que la respuesta principal sigue siendo sobre el pedido.
        serializer = self.get_serializer(order)
        # Devolvemos un mensaje más descriptivo.
        return Response({
            'message': f'Pedido {order.id} marcado como pagado y venta registrada con éxito.',
            'order': serializer.data
        }, status=status.HTTP_200_OK)

class OrderDetailViewSet(viewsets.ModelViewSet):
    queryset = OrderDetail.objects.all()
    serializer_class = OrderDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

class SaleRecordViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para consultar los registros de ventas.
    Permite filtrar las ventas por rango de fechas.
    El acceso está restringido a personal autenticado (staff).
    """
    queryset = SaleRecord.objects.all()
    serializer_class = SaleRecordSerializer
    permission_classes = [permissions.IsAdminUser] # Solo los admins/staff pueden ver los reportes de ventas

    # Configuración de filtros para poder buscar por fecha
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    filterset_fields = {
        'sale_timestamp': ['gte', 'lte', 'exact', 'date'] # gte = greater than or equal, lte = lower than or equal
    }

    # Ejemplo de URL para filtrar ventas de una fecha específica:
    # /api/v1/sales/?sale_timestamp__date=2025-06-05
    # Ejemplo para un rango de fechas:
    # /api/v1/sales/?sale_timestamp__gte=2025-06-01T00:00:00Z&sale_timestamp__lte=2025-06-05T23:59:59Z
# --- NUEVA VISTA PARA ESTADÍSTICAS DEL DASHBOARD ---

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser]) # Solo el personal puede ver las estadísticas
def dashboard_stats(request):
    """
    Endpoint que calcula y devuelve estadísticas clave para un dashboard.
    """
    today = date.today()

    # 1. Ventas totales del día de hoy
    sales_today = SaleRecord.objects.filter(sale_timestamp__date=today).aggregate(
        total_sales=Sum('total_amount')
    )['total_sales'] or 0.00

    # 2. Cantidad de pedidos (ventas) del día de hoy
    orders_today_count = SaleRecord.objects.filter(sale_timestamp__date=today).count()

    # 3. Productos más vendidos (Top 5)
    top_selling_products = SaleItemRecord.objects.values('product_name').annotate(
        total_sold=Sum('quantity')
    ).order_by('-total_sold')[:5] # Ordena de mayor a menor y toma los primeros 5

    # 4. Pedidos pendientes de confirmación
    pending_orders_count = Order.objects.filter(status='pending').count()

    # Construimos la respuesta
    stats = {
        'sales_today': f"{sales_today:.2f}",
        'orders_today_count': orders_today_count,
        'top_selling_products': list(top_selling_products), # Convertimos el QuerySet a una lista
        'pending_orders_count': pending_orders_count
    }

    return Response(stats, status=status.HTTP_200_OK)