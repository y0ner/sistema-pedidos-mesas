# management/admin.py

from django.contrib import admin
from .models import User, Product, Promotion, Table, Order, OrderDetail

# La siguiente línea le dice a Django que muestre el modelo User en el panel de admin.
admin.site.register(User)

# Hacemos lo mismo para el resto de nuestros modelos.
admin.site.register(Product)
admin.site.register(Promotion)
admin.site.register(Table)
admin.site.register(Order)
admin.site.register(OrderDetail)