# management/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet,
    ProductViewSet,
    PromotionViewSet,
    TableViewSet,
    OrderViewSet,
    OrderDetailViewSet,
    SaleRecordViewSet,
    dashboard_stats # <--- IMPORTA EL NUEVO VIEWSET
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'promotions', PromotionViewSet, basename='promotion')
router.register(r'tables', TableViewSet, basename='table')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'orderdetails', OrderDetailViewSet, basename='orderdetail')
router.register(r'sales', SaleRecordViewSet, basename='salerecord') # <--- REGISTRA LA NUEVA RUTA


urlpatterns = [
    path('', include(router.urls)),
    path('dashboard-stats/', dashboard_stats, name='dashboard-stats'),
]