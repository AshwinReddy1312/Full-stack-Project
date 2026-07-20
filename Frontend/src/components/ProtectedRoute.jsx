import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: 'var(--bg-gradient-end)' }}>
        <div className="text-center">
          <div className="spinner-border text-indigo" role="status" style={{ width: '3rem', height: '3rem', color: 'var(--accent-primary)' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-secondary" style={{ fontSize: '1.1rem', letterSpacing: '0.5px' }}>Verifying credentials...</p>
        </div>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
