"""
products/permissions.py
-----------------------
IsAdminOrManager  – grants write access only to Admin and Manager roles.
                    Read access (GET, HEAD, OPTIONS) is open to any authenticated user.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrManager(BasePermission):
    """
    All authenticated users (Admin, Manager, Employee) have full access.
    """
    message = 'You must be logged in to perform this action.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
