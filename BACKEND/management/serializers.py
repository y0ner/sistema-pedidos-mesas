# management/serializers.py
from rest_framework import serializers
from .models import User, Product, Promotion, Table, Order, OrderDetail

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