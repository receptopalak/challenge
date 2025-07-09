from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PlaneViewSet,
    CommandViewSet,
    UserDetailView,     # Import 'UserDetailView' instead of 'user_detail_view'
    UserAdminViewSet,
    PilotListView # Import PilotListView
)

router = DefaultRouter()
router.register(r'planes', PlaneViewSet, basename='plane')
router.register(r'commands', CommandViewSet, basename='command')
router.register(r'users', UserAdminViewSet, basename='user-admin')

# We are changing the order of URLs.
# The more specific 'users/me/' path should come before the router's general 'users/<pk>/' path.
urlpatterns = [
    path('users/me/', UserDetailView.as_view(), name='user-detail'),
    path('pilots/', PilotListView.as_view(), name='pilot-list'), # New endpoint
    path('', include(router.urls)),
]