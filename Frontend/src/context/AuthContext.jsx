import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Clear local storage tokens and reset user state
  const clearAuth = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  // Fetch the authenticated user's profile
  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/auth/profile/');
      if (response.data.success) {
        setUser(response.data.data);
      } else {
        clearAuth();
      }
    } catch (error) {
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }

    // Handle global logout triggered from api.js when token refresh fails
    const handleGlobalLogout = () => {
      clearAuth();
    };

    window.addEventListener('auth-logout', handleGlobalLogout);
    return () => {
      window.removeEventListener('auth-logout', handleGlobalLogout);
    };
  }, []);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login/', { email, password });
      if (response.data.success) {
        const { access, refresh, user: userData } = response.data.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        setUser(userData);
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message || 'Login failed' };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Invalid email or password';
      return { success: false, message: errorMsg, errors: error.response?.data?.errors };
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (formData) => {
    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      });

      const response = await api.post('/api/auth/register/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message || 'Registration failed' };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed';
      return { success: false, message: errorMsg, errors: error.response?.data?.errors };
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await api.post('/api/auth/logout/', { refresh: refreshToken });
      } catch (error) {
        console.error('Logout request failed', error);
      }
    }
    clearAuth();
  };

  // Update Profile handler
  const updateProfile = async (formData) => {
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      });

      const response = await api.put('/api/auth/profile/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setUser(response.data.data);
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message || 'Update failed' };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Update failed';
      return { success: false, message: errorMsg, errors: error.response?.data?.errors };
    }
  };

  // Change password handler
  const changePassword = async (old_password, new_password, new_password_confirm) => {
    try {
      const response = await api.put('/api/auth/change-password/', {
        old_password,
        new_password,
        new_password_confirm,
      });
      if (response.data.success) {
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message || 'Password update failed' };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Password update failed';
      return { success: false, message: errorMsg, errors: error.response?.data?.errors };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
