# core/urls.py
from django.contrib import admin
from django.urls import path, include # Asegúrate de que 'include' esté importado

urlpatterns = [
    path('admin/', admin.site.urls),
    # Nueva línea para incluir las URLs de nuestra API de 'management'
    path('api/v1/', include('management.urls')),
    # El prefijo 'api/v1/' significa que todas las URLs de 'management'
    # ahora comenzarán con http://127.0.0.1:8000/api/v1/
    # Por ejemplo: /api/v1/products/, /api/v1/orders/, etc.
]