# management/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet,
    ProductViewSet,
    PromotionViewSet,
    TableViewSet,
    OrderViewSet,
    OrderDetailViewSet
)

# Crea un router y registra nuestros viewsets con él.
# DefaultRouter se encarga de generar automáticamente las URLs para las acciones estándar
# (list, create, retrieve, update, partial_update, destroy).
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'promotions', PromotionViewSet, basename='promotion')
router.register(r'tables', TableViewSet, basename='table')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'orderdetails', OrderDetailViewSet, basename='orderdetail')

# Las URLs de la API son determinadas automáticamente por el router.
# Estas URLs se incluirán luego en el urls.py principal del proyecto.
urlpatterns = [
    path('', include(router.urls)),
]