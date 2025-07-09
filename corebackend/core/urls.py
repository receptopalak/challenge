from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.conf import settings
from django.conf.urls.static import static

# --- Swagger/OpenAPI Şema Görünümü Yapılandırması ---
schema_view = get_schema_view(
   openapi.Info(
      title="Baykar Filo Yönetimi API",
      default_version='v1',
              description="API documentation for Real Backend (Django). Manages aircraft, pilot and command operations.",
      contact=openapi.Contact(email="contact@baykar.dev"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # Admin Paneli
    path('admin/', admin.site.urls),

    # API URL'leri
    path('api/fleet/', include('fleet.urls')),

    # JWT Authentication URL'leri
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Swagger and ReDoc URLs
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
            # TYPO FIXED HERE: schema_vew -> schema_view
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Geliştirme ortamında (DEBUG=True) statik dosyaları sunmak için.
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)