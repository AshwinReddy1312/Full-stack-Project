from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

class AuthenticationAPITests(APITestCase):
    def setUp(self):
        self.register_url = reverse('auth_register')
        self.login_url = reverse('auth_login')
        self.logout_url = reverse('auth_logout')
        self.refresh_url = reverse('auth_token_refresh')
        self.profile_url = reverse('auth_profile')
        self.change_password_url = reverse('auth_change_password')

        # Sample user data for registration
        self.register_data = {
            "username": "testuser",
            "email": "testuser@example.com",
            "password": "StrongPassword123!",
            "password_confirm": "StrongPassword123!",
            "first_name": "Test",
            "last_name": "User",
            "phone_number": "1234567890",
            "role": "Employee"
        }

        # Create a user for login/profile tests
        self.existing_user = User.objects.create_user(
            username="existinguser",
            email="existing@example.com",
            password="ExistingPassword123!",
            first_name="Existing",
            last_name="User",
            phone_number="0987654321",
            role="Manager"
        )

    def test_user_registration_success(self):
        response = self.client.post(self.register_url, self.register_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['message'], "Registration successful")
        self.assertEqual(response.data['data']['email'], self.register_data['email'])
        self.assertNotIn('password', response.data['data'])

    def test_user_registration_mismatched_passwords(self):
        data = self.register_data.copy()
        data['password_confirm'] = "DifferentPassword123!"
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['message'], "Validation failed")
        self.assertIn('password_confirm', response.data['errors'])

    def test_user_registration_duplicate_email(self):
        data = self.register_data.copy()
        data['email'] = self.existing_user.email
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('email', response.data['errors'])

    def test_user_login_success(self):
        login_data = {
            "email": "existing@example.com",
            "password": "ExistingPassword123!"
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('access', response.data['data'])
        self.assertIn('refresh', response.data['data'])
        self.assertEqual(response.data['data']['user']['email'], self.existing_user.email)

    def test_user_login_invalid_credentials(self):
        login_data = {
            "email": "existing@example.com",
            "password": "WrongPassword!"
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data['success'])
        self.assertIn('detail', response.data['errors'])

    def test_get_user_profile_authenticated(self):
        self.client.force_authenticate(user=self.existing_user)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['email'], self.existing_user.email)

    def test_get_user_profile_unauthenticated(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data['success'])

    def test_update_user_profile(self):
        self.client.force_authenticate(user=self.existing_user)
        update_data = {
            "first_name": "UpdatedName",
            "phone_number": "9999999999"
        }
        response = self.client.put(self.profile_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['first_name'], "UpdatedName")
        self.assertEqual(response.data['data']['phone_number'], "9999999999")

    def test_change_password(self):
        self.client.force_authenticate(user=self.existing_user)
        change_data = {
            "old_password": "ExistingPassword123!",
            "new_password": "NewStrongPassword456!",
            "new_password_confirm": "NewStrongPassword456!"
        }
        response = self.client.put(self.change_password_url, change_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

        # Verify login with new password
        login_data = {
            "email": "existing@example.com",
            "password": "NewStrongPassword456!"
        }
        self.client.logout()
        login_response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

    def test_token_refresh(self):
        login_data = {
            "email": "existing@example.com",
            "password": "ExistingPassword123!"
        }
        login_response = self.client.post(self.login_url, login_data, format='json')
        refresh_token = login_response.data['data']['refresh']

        refresh_data = {
            "refresh": refresh_token
        }
        response = self.client.post(self.refresh_url, refresh_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('access', response.data['data'])

    def test_logout_blacklists_token(self):
        login_data = {
            "email": "existing@example.com",
            "password": "ExistingPassword123!"
        }
        login_response = self.client.post(self.login_url, login_data, format='json')
        refresh_token = login_response.data['data']['refresh']
        access_token = login_response.data['data']['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        logout_data = {
            "refresh": refresh_token
        }
        response = self.client.post(self.logout_url, logout_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

        # Try to refresh again using the blacklisted refresh token
        self.client.credentials()  # Clear credentials
        refresh_response = self.client.post(self.refresh_url, {"refresh": refresh_token}, format='json')
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)

