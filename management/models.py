# management/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser

# El modelo de usuario personalizado. Extiende AbstractUser de Django.
# Un usuario con is_staff=True será un administrador/encargado del local.
class User(AbstractUser):
    # Puedes añadir campos adicionales si lo necesitas en el futuro, por ejemplo:
    # phone_number = models.CharField(max_length=15, blank=True, null=True)
    # address = models.CharField(max_length=255, blank=True, null=True)
    pass # No se añaden campos adicionales por ahora, solo se extiende.

class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    # ImageField requiere la librería Pillow: pip install Pillow
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    availability = models.BooleanField(default=True) # Indica si el producto está disponible

    def __str__(self):
        return self.name # Representación legible del objeto en el admin

class Promotion(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True) # Para activar/desactivar la promoción

    def __str__(self):
        return self.title

class Table(models.Model):
    number = models.IntegerField(unique=True) # Cada mesa tendrá un número único
    # Opciones de estado para la mesa, según el documento técnico
    STATUS_CHOICES = [
        ('available', 'Disponible'),
        ('occupied', 'Ocupada'),
        ('reserved', 'Reservada'),
        ('blocked', 'Bloqueada'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    # Código dinámico para vincular al cliente. Puede ser nulo/vacío si no está asignado.
    current_code = models.CharField(max_length=10, unique=True, blank=True, null=True)
    # Fecha de la última actualización del código para control de caducidad
    last_code_update = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Mesa {self.number}"

class Order(models.Model):
    # Relación uno a muchos: una mesa puede tener muchos pedidos.
    # on_delete=models.SET_NULL: Si la mesa se elimina, el campo 'table' en Order se pone a NULL.
    # null=True: Permite que el campo 'table' sea NULL.
    # related_name='orders': Permite acceder a los pedidos desde un objeto Table (ej. my_table.orders.all())
    table = models.ForeignKey(Table, on_delete=models.SET_NULL, null=True, related_name='orders')
    # Opciones de estado para el pedido
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),     # Recibido del cliente, aún no validado
        ('confirmed', 'Confirmado'),  # Validado por el mesero/administrador
        ('preparing', 'En preparación'),
        ('delivered', 'Entregado'),
        ('paid', 'Pagado'),
        ('cancelled', 'Cancelado'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True) # Fecha y hora de creación automática
    updated_at = models.DateTimeField(auto_now=True)   # Fecha y hora de última actualización automática

    def __str__(self):
        return f"Pedido {self.id} - Mesa {self.table.number if self.table else 'N/A'} ({self.status})"

class OrderDetail(models.Model):
    # Relación uno a muchos: un pedido puede tener muchos detalles (líneas de producto).
    # on_delete=models.CASCADE: Si el pedido se elimina, todos sus detalles también se eliminan.
    # related_name='details': Permite acceder a los detalles desde un objeto Order (ej. my_order.details.all())
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='details')
    # Relación uno a muchos: un detalle de pedido se refiere a un producto específico.
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2) # Subtotal para esta línea de producto

    # Este método se ejecuta antes de guardar el objeto
    def save(self, *args, **kwargs):
        # Si el subtotal no se ha establecido (o es 0), lo calcula automáticamente
        if not self.subtotal or self.subtotal == 0:
            # Asegúrate de que el producto tenga un precio antes de calcular
            if self.product and self.product.price:
                self.subtotal = self.product.price * self.quantity
            else:
                # Opcional: manejar el caso donde el producto no tiene precio
                self.subtotal = 0
        super().save(*args, **kwargs) # Llama al método save original para guardar el objeto

    def __str__(self):
        return f"{self.quantity} x {self.product.name} para Pedido {self.order.id}"