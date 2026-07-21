import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="auth-page">
      {/* Decorative background blobs */}
      <div style={{
        position: 'fixed', top: '-120px', right: '-120px',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,197,24,0.18) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '-100px', left: '-100px',
        width: 350, height: 350, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,197,24,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div className="container py-5" style={{ position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div className="text-center mb-5">
          <div className="d-inline-flex align-items-center gap-2">
            <div style={{
              width: 38, height: 38, background: 'var(--accent)',
              borderRadius: 10, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem',
            }}>
              AI
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
              BizDashboard
            </span>
          </div>
        </div>

        <div className="d-flex justify-content-center">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
