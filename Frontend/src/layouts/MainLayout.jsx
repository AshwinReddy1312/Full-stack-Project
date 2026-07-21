import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const NAV_ITEMS = [
  { label: 'Dashboard',   icon: 'bi-grid-fill',                    path: '/',             exact: true },
  { label: 'Products',    icon: 'bi-box-seam-fill',                path: '/products'                  },
  { label: 'Customers',   icon: 'bi-people-fill',                  path: '/customers'                 },
  { label: 'Data Import', icon: 'bi-file-earmark-arrow-up-fill',   path: '/uploads'                   },
  { label: 'AI Insights', icon: 'bi-stars',                        path: '/ai-insights'               },
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

  const getAvatar = () => {
    if (user?.profile_image) {
      return user.profile_image.startsWith('http')
        ? user.profile_image
        : `${API_URL}${user.profile_image}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent((user?.first_name || '') + ' ' + (user?.last_name || ''))}&background=f5c518&color=1a1a1a&bold=true`;
  };

  const isActive = (item) =>
    item.exact
      ? location.pathname === item.path
      : location.pathname === item.path || location.pathname.startsWith(item.path + '/');

  const getPageMeta = () => {
    const p = location.pathname;
    if (p === '/')                        return { title: 'Dashboard',       sub: 'Your business analytics overview' };
    if (p === '/products')                return { title: 'Products',         sub: 'Manage your product catalogue' };
    if (p === '/products/add')            return { title: 'Add Product',      sub: 'Create a new product' };
    if (p.startsWith('/products/edit/'))  return { title: 'Edit Product',     sub: 'Update product details' };
    if (p.startsWith('/products/'))       return { title: 'Product Details',  sub: 'View product information' };
    if (p === '/customers')               return { title: 'Customers',        sub: 'Manage your customer database' };
    if (p === '/customers/add')           return { title: 'Add Customer',     sub: 'Register a new customer' };
    if (p.startsWith('/customers/edit/')) return { title: 'Edit Customer',    sub: 'Update customer details' };
    if (p.startsWith('/customers/'))      return { title: 'Customer Details', sub: 'View customer profile' };
    if (p === '/uploads')                 return { title: 'Data Import',      sub: 'CSV upload history' };
    if (p === '/uploads/new')             return { title: 'Import CSV',       sub: 'Upload and process business data' };
    if (p.startsWith('/uploads/'))        return { title: 'Upload Detail',    sub: 'View import summary' };
    if (p === '/ai-insights')             return { title: 'AI Insights',      sub: 'GPT-4o powered business analysis' };
    return { title: 'AI Dashboard', sub: '' };
  };

  const { title, sub } = getPageMeta();

  return (
    <div className="dashboard-container">

      {/* ── Mobile overlay ─────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ background: 'rgba(0,0,0,0.25)', zIndex: 199, backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside className={`sidebar-panel ${sidebarOpen ? 'open' : ''}`}>

        {/* Logo */}
        <div className="sidebar-logo d-flex align-items-center gap-2">
          <div
            style={{
              width: 34, height: 34,
              background: 'var(--accent)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', fontWeight: 800, color: '#1a1a1a',
              flexShrink: 0,
            }}
          >
            AI
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            BizDashboard
          </span>
        </div>

        {/* Nav */}
        <div className="flex-grow-1 pt-2">
          <div className="sidebar-section-label">Main Menu</div>
          <nav>
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
        </div>

        {/* User footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
          <div className="d-flex align-items-center gap-3 mb-3">
            <img
              src={getAvatar()}
              alt="Profile"
              className="avatar avatar-sm flex-shrink-0"
            />
            <div className="overflow-hidden">
              <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }} className="text-truncate">
                {user?.first_name} {user?.last_name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user?.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-ghost w-100 d-flex align-items-center justify-content-center gap-2"
            style={{ fontSize: '0.82rem', color: '#dc2626', borderColor: '#fecaca' }}
          >
            <i className="bi bi-box-arrow-right"></i>
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main wrapper ─────────────────────────────────── */}
      <div className="main-wrapper">

        {/* Header */}
        <header className="header-panel">
          {/* Mobile hamburger */}
          <div className="d-flex align-items-center gap-3">
            <button
              className="btn btn-ghost btn-sm d-lg-none"
              style={{ padding: '0.4rem 0.6rem' }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <i className="bi bi-list fs-5"></i>
            </button>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {title}
              </div>
              {sub && (
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{sub}</div>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="d-flex align-items-center gap-3">
            {/* Notification bell */}
            <button
              className="btn btn-ghost"
              style={{ padding: '0.45rem 0.65rem', position: 'relative', borderRadius: 10 }}
            >
              <i className="bi bi-bell" style={{ fontSize: '1rem' }}></i>
              <span
                style={{
                  position: 'absolute', top: 6, right: 7,
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#ef4444', border: '1.5px solid white',
                }}
              ></span>
            </button>

            {/* User pill */}
            <div
              className="d-flex align-items-center gap-2"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 999,
                padding: '0.3rem 0.75rem 0.3rem 0.3rem',
                cursor: 'pointer',
              }}
            >
              <img src={getAvatar()} alt="Avatar" className="avatar" style={{ width: 30, height: 30, borderRadius: '50%' }} />
              <div className="d-none d-sm-block">
                <div style={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.2 }}>
                  {user?.first_name} {user?.last_name}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{user?.role}</div>
              </div>
            </div>
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
