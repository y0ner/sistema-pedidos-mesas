# core/urls.py
from django.contrib import admin
from django.urls import path, include

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# --- NUEVAS IMPORTACIONES PARA DRF-SPECTACULAR ---
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('management.urls')), # Nuestras URLs de la API
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # --- NUEVAS URLs PARA LA DOCUMENTACIÓN DE LA API ---
    # Sirve el archivo schema.yml o schema.json (el "plano" de tu API)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    # Interfaz Swagger UI:
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # Interfaz ReDoc:
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]