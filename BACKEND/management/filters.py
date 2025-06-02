# management/filters.py
import django_filters
from .models import Product

class ProductFilter(django_filters.FilterSet):
    # Filtro para buscar productos por nombre (búsqueda parcial, insensible a mayúsculas)
    name = django_filters.CharFilter(field_name='name', lookup_expr='icontains')

    # Filtro para buscar productos por descripción (búsqueda parcial, insensible a mayúsculas)
    description = django_filters.CharFilter(field_name='description', lookup_expr='icontains')

    # Filtro para productos con precio menor o igual a un valor
    price__lte = django_filters.NumberFilter(field_name='price', lookup_expr='lte')

    # Filtro para productos con precio mayor o igual a un valor
    price__gte = django_filters.NumberFilter(field_name='price', lookup_expr='gte')

    class Meta:
        model = Product
        # Especificamos los campos por los que se podrá filtrar directamente,
        # además de los que definimos arriba.
        # 'availability' permitirá filtrar por ?availability=true o ?availability=false
        fields = ['availability', 'name', 'description', 'price__lte', 'price__gte']