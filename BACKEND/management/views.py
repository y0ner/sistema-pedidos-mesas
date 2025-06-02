# management/views.py

import random
from django.utils import timezone
from django.db import transaction # <--- ¡ESTA ES LA IMPORTACIÓN CLAVE QUE FALTABA O ESTABA INCORRECTA!
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter
import django_filters

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

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer

    def get_permissions(self):
        if self.action == 'create':
            self.permission_classes = [permissions.AllowAny]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        write_serializer = self.get_serializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        details_data = write_serializer.validated_data.pop('details')
        customer_name_data = write_serializer.validated_data.pop('customer_name', None)
        try:
            with transaction.atomic(): # Aquí es donde se usa 'transaction'
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

class OrderDetailViewSet(viewsets.ModelViewSet):
    queryset = OrderDetail.objects.all()
    serializer_class = OrderDetailSerializer
    permission_classes = [permissions.IsAuthenticated]