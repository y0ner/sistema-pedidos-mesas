# management/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
from django.db import models
from django.utils import timezone
from django.conf import settings
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

# En management/models.py

class Table(models.Model):
    number = models.IntegerField(unique=True)
    STATUS_CHOICES = [
        ('available', 'Disponible'),
        ('occupied', 'Ocupada'),
        ('reserved', 'Reservada'),
        ('unavailable', 'No disponible'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='available'
    )
    current_code = models.CharField(max_length=4, blank=True, null=True, unique=True)
    last_code_update = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Mesa {self.number} ({self.status})"

    # --- AÑADE ESTE MÉTODO ---
    def save(self, *args, **kwargs):
        # Si el current_code es un texto vacío, conviértelo a None
        if self.current_code == "":
            self.current_code = None
        super().save(*args, **kwargs) # Llama al método de guardado original

class Order(models.Model):
    # Relación uno a muchos: una mesa puede tener muchos pedidos.
    # on_delete=models.SET_NULL: Si la mesa se elimina, el campo 'table' en Order se pone a NULL.
    # null=True: Permite que el campo 'table' sea NULL.
    # related_name='orders': Permite acceder a los pedidos desde un objeto Table (ej. my_table.orders.all())
    table = models.ForeignKey(Table, on_delete=models.SET_NULL, null=True, related_name='orders')
    # Opciones de estado para el pedid
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('confirmed', 'Confirmado'),
        ('preparing', 'En preparación'),
        ('delivered', 'Entregado'),
        ('paid', 'Pagado'),
        ('annulled', 'Anulado'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True) # Fecha y hora de creación automática
    updated_at = models.DateTimeField(auto_now=True)   # Fecha y hora de última actualización automática
    #se agrego el tema del nombre del cliente
    # Nombre del cliente, opcional. Puede ser útil para pedidos a domicilio o reservas.
    customer_name = models.CharField(max_length=100, blank=True, null=True) # Nombre del cliente, opcional
     # --- NUEVO CAMPO PARA LA LLAVE DE ACCESO ---
    view_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    paid_at = models.DateTimeField(null=True, blank=True, editable=False)


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
    
class SaleRecord(models.Model):
    # Un registro de venta se relaciona con un único pedido
    order = models.OneToOneField(
        'Order', 
        on_delete=models.PROTECT, # Protege este registro de venta si el pedido original es borrado
        related_name='sale_record',
        help_text="El pedido al que corresponde esta venta."
    )
    total_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Monto total del pedido en el momento de la venta."
    )
    sale_timestamp = models.DateTimeField(
        auto_now_add=True, # Registra automáticamente la fecha y hora de creación
        help_text="Fecha y hora en que se registró la venta."
    )
    # Opcional: ¿Quién procesó la venta? (útil para auditorías)
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, # Referencia al modelo de usuario de Django (admin/personal)
        on_delete=models.SET_NULL, # Si el usuario que procesó la venta se borra, no se borra la venta
        null=True, blank=True,
        help_text="Usuario de personal que procesó esta venta."
    )

    class Meta:
        verbose_name = "Registro de Venta"
        verbose_name_plural = "Registros de Ventas"
        ordering = ['-sale_timestamp'] # Ordena por fecha de venta descendente por defecto

    def __str__(self):
        return f"Venta #{self.id} - Pedido {self.order.id} - ${self.total_amount} - {self.sale_timestamp.strftime('%Y-%m-%d %H:%M')}"


class SaleItemRecord(models.Model):
    # Cada artículo vendido se relaciona con un registro de venta
    sale_record = models.ForeignKey(
        'SaleRecord', 
        on_delete=models.CASCADE, # Si se borra el registro de venta, se borran sus ítems
        related_name='items_sold', # Nombre para acceder a los ítems desde SaleRecord (ej. my_sale_record.items_sold.all())
        help_text="Registro de venta al que pertenece este artículo."
    )
    # Campos para guardar la "fotografía" del producto en el momento de la venta
    product_name = models.CharField(
        max_length=255,
        help_text="Nombre del producto en el momento de la venta."
    )
    product_price_at_sale = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Precio del producto en el momento de la venta."
    )
    quantity = models.IntegerField(
        help_text="Cantidad vendida de este producto."
    )
    subtotal = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Subtotal por este artículo (cantidad * precio en venta)."
    )

    class Meta:
        verbose_name = "Artículo Vendido"
        verbose_name_plural = "Artículos Vendidos"

    def __str__(self):
        return f"{self.product_name} x {self.quantity} para Venta #{self.sale_record.id}"