from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from django.contrib.auth import get_user_model
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    UpdateProfileSerializer,
    ChangePasswordSerializer
)

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        # Include full user details in the login response
        user_serializer = UserSerializer(self.user, context=self.context)
        data['user'] = user_serializer.data
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])
        
        return Response({
            "success": True,
            "message": "Login successful",
            "data": serializer.validated_data
        }, status=status.HTTP_200_OK)

class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])
        
        return Response({
            "success": True,
            "message": "Token refreshed successfully",
            "data": serializer.validated_data
        }, status=status.HTTP_200_OK)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            user_serializer = UserSerializer(user, context={'request': request})
            return Response({
                "success": True,
                "message": "Registration successful",
                "data": user_serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            "success": False,
            "message": "Validation failed",
            "data": {},
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({
                    "success": False,
                    "message": "Refresh token is required",
                    "data": {},
                    "errors": {"refresh": "This field is required."}
                }, status=status.HTTP_400_BAD_REQUEST)
                
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response({
                "success": True,
                "message": "Logout successful",
                "data": {}
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "success": False,
                "message": "Invalid or expired token",
                "data": {},
                "errors": {"refresh": str(e)}
            }, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user, context={'request': request})
        return Response({
            "success": True,
            "message": "Profile retrieved successfully",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    def put(self, request):
        serializer = UpdateProfileSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            user_serializer = UserSerializer(request.user, context={'request': request})
            return Response({
                "success": True,
                "message": "Profile updated successfully",
                "data": user_serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response({
            "success": False,
            "message": "Validation failed",
            "data": {},
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({
                "success": True,
                "message": "Password changed successfully",
                "data": {}
            }, status=status.HTTP_200_OK)
        
        return Response({
            "success": False,
            "message": "Validation failed",
            "data": {},
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
