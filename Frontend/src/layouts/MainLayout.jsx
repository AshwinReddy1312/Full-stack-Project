import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ── Sidebar nav items ──────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    label: 'Dashboard',
    icon: 'bi-grid-1x2-fill',
    path: '/',
    exact: true,
  },
  {
    label: 'Products',
    icon: 'bi-box-seam-fill',
    path: '/products',
  },
];

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getProfileImage = () => {
    if (user?.profile_image) {
      return user.profile_image.startsWith('http')
        ? user.profile_image
        : `${API_URL}${user.profile_image}`;
    }
    return 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  };

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  // Page title derived from current path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/')                           return { title: 'Dashboard',        sub: 'Workspace overview' };
    if (path === '/products')                   return { title: 'Products',         sub: 'Manage your product catalogue' };
    if (path === '/products/add')               return { title: 'Add Product',      sub: 'Create a new product' };
    if (path.startsWith('/products/edit/'))     return { title: 'Edit Product',     sub: 'Update product details' };
    if (path.startsWith('/products/'))         return { title: 'Product Details',  sub: 'View product information' };
    return { title: 'AI Dashboard', sub: '' };
  };

  const { title, sub } = getPageTitle();

  return (
    <div className="dashboard-container">
      {/* Background spheres */}
      <div className="bg-glow-sphere-1" style={{ opacity: 0.5 }}></div>
      <div className="bg-glow-sphere-2" style={{ opacity: 0.5 }}></div>

      {/* ── Mobile overlay ───────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ background: 'rgba(0,0,0,0.6)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside
        className="sidebar-panel"
        style={
          sidebarOpen
            ? { transform: 'translateX(0)' }
            : {}
        }
      >
        {/* Logo */}
        <div className="d-flex align-items-center justify-content-center gap-2 my-4 px-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-3"
            style={{ width: '38px', height: '38px', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}
          >
            <i className="bi bi-cpu-fill" style={{ color: 'var(--accent-secondary)', fontSize: '1.1rem' }}></i>
          </div>
          <span className="fs-5 fw-bold text-gradient">AI Dashboard</span>
        </div>

        {/* Nav section label */}
        <div className="px-4 mb-2">
          <small className="text-secondary fw-semibold" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Main Menu
          </small>
        </div>

        {/* Nav links */}
        <nav className="flex-grow-1 px-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive(item) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <i className={`bi ${item.icon}`}></i>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-top mt-auto" style={{ borderColor: 'rgba(255,255,255,0.06) !important' }}>
          <div className="d-flex align-items-center mb-3 px-2 gap-3">
            <img
              src={getProfileImage()}
              alt="Profile"
              className="rounded-circle flex-shrink-0"
              style={{ width: '40px', height: '40px', objectFit: 'cover', border: '2px solid rgba(99,102,241,0.4)' }}
            />
            <div className="overflow-hidden">
              <div className="fw-semibold text-truncate" style={{ fontSize: '0.875rem' }}>
                {user?.first_name} {user?.last_name}
              </div>
              <div className="text-secondary text-truncate" style={{ fontSize: '0.75rem' }}>
                {user?.role}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-outline-danger w-100 rounded-3 py-2"
            style={{ fontSize: '0.85rem', borderColor: 'rgba(239,68,68,0.3)' }}
          >
            <i className="bi bi-box-arrow-right me-2"></i>Logout
          </button>
        </div>
      </aside>

      {/* ── Main content area ─────────────────────────────────── */}
      <div className="d-flex flex-column flex-grow-1 overflow-hidden">
        {/* Top header */}
        <header className="header-panel">
          {/* Mobile hamburger */}
          <button
            className="btn btn-sm d-lg-none me-3 rounded-3"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <i className="bi bi-list fs-5"></i>
          </button>

          <div>
            <h5 className="mb-0 fw-semibold">{title}</h5>
            {sub && <small className="text-secondary">{sub}</small>}
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="me-1 text-end d-none d-sm-block">
              <div className="fw-semibold" style={{ fontSize: '0.875rem' }}>
                {user?.first_name} {user?.last_name}
              </div>
              <span
                className="badge rounded-pill px-2 py-1"
                style={{ fontSize: '0.7rem', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}
              >
                {user?.role}
              </span>
            </div>
            <img
              src={getProfileImage()}
              alt="Avatar"
              className="rounded-circle"
              style={{ width: '40px', height: '40px', objectFit: 'cover', border: '2px solid rgba(99,102,241,0.4)' }}
            />
          </div>
        </header>

        {/* Page content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
