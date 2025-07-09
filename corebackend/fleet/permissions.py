from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminUser(BasePermission):
    """
    Only allows access to admin (is_staff=True) users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_staff

class IsAdminOrReadOnly(BasePermission):
    """
    Only allows admin users to have write (POST, PUT, PATCH, DELETE) permission,
    all other (authenticated) users have only read (GET) permission.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_staff

class IsPilotOwner(BasePermission):
    """
    Checks whether a request is made by the pilot who owns the object.
    For example, a pilot can only update their own commands.
    """
    def has_object_permission(self, request, view, obj):
        # This permission only works for individual object details.
        # obj here is a Command object.
        return obj.pilot.user == request.user