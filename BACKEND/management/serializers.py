# management/serializers.py
from rest_framework import serializers
from .models import User, Product, Promotion, Table, Order, OrderDetail, SaleRecord, SaleItemRecord # Asegúrate que SaleRecord y SaleItemRecord estén en la importación
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined']

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = '__all__'

class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = '__all__'

# Serializer para MOSTRAR los detalles de un pedido (lectura)
class OrderDetailSerializer(serializers.ModelSerializer):
    # Incluimos información del producto para una mejor visualización
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderDetail
        fields = ['id', 'product', 'quantity', 'subtotal']

# NUEVO Serializer para RECIBIR los detalles de un pedido (escritura)
class OrderDetailWriteSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField() # Esperamos el ID del producto

    class Meta:
        model = OrderDetail
        fields = ['product_id', 'quantity']


# SERIALIZER DE ORDER ACTUALIZADO
class OrderSerializer(serializers.ModelSerializer):
    details = OrderDetailSerializer(many=True, read_only=True)
    details_write = OrderDetailWriteSerializer(many=True, write_only=True, source='details')
    table_number = serializers.IntegerField(source='table.number', read_only=True, required=False)

    class Meta:
        model = Order
        fields = [
            'id', 'table', 'table_number', 'status', 'total', 
            'created_at', 'updated_at', 'customer_name',
            'view_token', # <-- AÑADIMOS EL NUEVO CAMPO AQUÍ
            'details', 'details_write'
        ]
        # Hacemos que view_token sea de solo lectura, junto con los otros
        read_only_fields = ['total', 'status', 'table_number', 'view_token']


# --- NUEVOS SERIALIZERS PARA REPORTERÍA DE VENTAS ---

class SaleItemRecordSerializer(serializers.ModelSerializer):
    """
    Serializer para mostrar cada artículo dentro de un registro de venta.
    """
    class Meta:
        model = SaleItemRecord
        fields = ['product_name', 'product_price_at_sale', 'quantity', 'subtotal']

class SaleRecordSerializer(serializers.ModelSerializer):
    """
    Serializer para mostrar un registro de venta completo, incluyendo sus artículos.
    """
    # Usamos el related_name 'items_sold' que definimos en el modelo SaleItemRecord
    items_sold = SaleItemRecordSerializer(many=True, read_only=True)
    # Para mostrar el nombre del usuario que procesó la venta en lugar de solo su ID
    processed_by_username = serializers.CharField(source='processed_by.username', read_only=True, default=None)

    class Meta:
        model = SaleRecord
        fields = [
            'id', 
            'order', # ID del pedido original
            'total_amount', 
            'sale_timestamp', 
            'processed_by_username', # Nombre del staff que confirmó el pago
            'items_sold' # Lista anidada con los detalles de los productos vendidos
        ]