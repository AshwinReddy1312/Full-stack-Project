import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getProfileImage = () => {
    if (user?.profile_image) {
      if (user.profile_image.startsWith('http')) {
        return user.profile_image;
      }
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      return `${baseUrl}${user.profile_image}`;
    }
    return 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  };

  return (
    <div className="dashboard-container">
      {/* Background Decorative Spheres */}
      <div className="bg-glow-sphere-1" style={{ opacity: 0.5 }}></div>
      <div className="bg-glow-sphere-2" style={{ opacity: 0.5 }}></div>

      {/* Sidebar */}
      <aside className="sidebar-panel">
        <div className="d-flex align-items-center justify-content-center my-4">
          <i className="bi bi-cpu-fill fs-2 me-2" style={{ color: 'var(--accent-secondary)' }}></i>
          <span className="fs-4 fw-bold text-gradient">AI Dashboard</span>
        </div>
        
        <nav className="flex-grow-1">
          <Link to="/" className={`sidebar-link ${location.pathname === '/' ? 'active' : ''}`}>
            <i className="bi bi-grid-1x2-fill"></i>
            Dashboard
          </Link>
        </nav>
        
        <div className="p-3 border-top border-secondary border-opacity-10 mt-auto">
          <div className="d-flex align-items-center mb-3 px-3">
            <img 
              src={getProfileImage()} 
              alt="User Profile" 
              className="rounded-circle border border-secondary border-opacity-20 me-3"
              style={{ width: '40px', height: '40px', objectFit: 'cover' }}
            />
            <div className="overflow-hidden">
              <div className="fw-semibold text-truncate">{user?.first_name} {user?.last_name}</div>
              <div className="text-secondary text-truncate fs-7" style={{ fontSize: '0.8rem' }}>{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-outline-danger w-100 border-opacity-20 rounded-3 py-2">
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <div className="d-flex flex-column flex-grow-1">
        {/* Top Header */}
        <header className="header-panel">
          <div>
            <h5 className="mb-0 fw-semibold">Workspace Overview</h5>
            <small className="text-secondary">Stage 1 - Project Setup & Auth Verification</small>
          </div>
          
          <div className="d-flex align-items-center">
            <div className="me-3 text-end d-none d-sm-block">
              <div className="fw-semibold">{user?.first_name} {user?.last_name}</div>
              <span className="badge bg-indigo-subtle border border-indigo-subtle text-indigo rounded-pill px-2.5 py-1" style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', borderColor: 'var(--card-border)' }}>
                {user?.role}
              </span>
            </div>
            
            <img 
              src={getProfileImage()} 
              alt="Avatar" 
              className="rounded-circle border border-indigo"
              style={{ width: '42px', height: '42px', objectFit: 'cover', borderColor: 'var(--accent-primary)' }}
            />
          </div>
        </header>

        {/* Main Content Body */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
