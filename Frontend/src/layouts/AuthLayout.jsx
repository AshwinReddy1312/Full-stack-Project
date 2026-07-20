import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-vh-100 w-100 d-flex align-items-center justify-content-center position-relative overflow-hidden" style={{ background: 'var(--bg-gradient-end)' }}>
      {/* Background Decorative Spheres */}
      <div className="bg-glow-sphere-1"></div>
      <div className="bg-glow-sphere-2"></div>
      
      <div className="container py-5 d-flex align-items-center justify-content-center" style={{ zIndex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
