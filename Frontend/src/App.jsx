import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';

// Auth pages
import Login    from './pages/Login';
import Register from './pages/Register';

// Dashboard
import Dashboard from './pages/Dashboard';

// Products
import ProductList   from './pages/Products/ProductList';
import AddProduct    from './pages/Products/AddProduct';
import EditProduct   from './pages/Products/EditProduct';
import ProductDetail from './pages/Products/ProductDetail';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public auth routes ── */}
          <Route element={<AuthLayout />}>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* ── Protected routes ── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              {/* Dashboard */}
              <Route path="/" element={<Dashboard />} />

              {/* Products */}
              <Route path="/products"              element={<ProductList />} />
              <Route path="/products/add"          element={<AddProduct />} />
              <Route path="/products/:id"          element={<ProductDetail />} />
              <Route path="/products/edit/:id"     element={<EditProduct />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </AuthProvider>
  );
}

export default App;
