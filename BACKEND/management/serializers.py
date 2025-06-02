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
    # Para que al leer un pedido, veamos el número de mesa y no solo el ID
    table_number = serializers.IntegerField(source='table.number', read_only=True, required=False)


    class Meta:
        model = Order
        # AÑADIMOS 'customer_name' A LA LISTA DE CAMPOS
        # Y 'table_number' para la lectura
        fields = [
            'id', 'table', 'table_number', 'status', 'total', 
            'created_at', 'updated_at', 'customer_name', # <-- customer_name añadido
            'details', 'details_write'
        ]
        # 'customer_name' será escribible.
        # 'table' será el campo para escribir (espera un ID de mesa).
        # 'table_number' es solo para leer y mostrar.
        read_only_fields = ['total', 'status', 'table_number']