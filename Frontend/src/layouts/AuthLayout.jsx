import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="auth-page" style={{ background: '#f0f4ff' }}>
      {/* Background decorative circles */}
      <div style={{
        position: 'fixed', top: '-140px', right: '-140px',
        width: 480, height: 480, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(26,86,219,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '-100px', left: '-100px',
        width: 380, height: 380, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', top: '40%', left: '10%',
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(26,86,219,0.06) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div className="container py-5" style={{ position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div className="text-center mb-5">
          <div className="d-inline-flex flex-column align-items-center gap-2">
            {/* Logo mark */}
            <div style={{
              width: 56, height: 56,
              background: 'linear-gradient(135deg, #1a56db 0%, #0ea5e9 100%)',
              borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(26,86,219,0.35)',
              marginBottom: 4,
            }}>
              <i className="bi bi-bar-chart-line-fill" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
            </div>
            {/* Brand name */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontWeight: 800, fontSize: '1.5rem', color: '#0f172a', letterSpacing: '-0.5px' }}>
                Insight
              </span>
              <span style={{
                fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.5px',
                background: 'linear-gradient(135deg, #1a56db 0%, #0ea5e9 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                IQ
              </span>
            </div>
            {/* Tagline */}
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Transform Data into Decisions
            </p>
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
