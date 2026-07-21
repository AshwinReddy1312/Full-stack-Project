import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';

// Auth
import Login    from './pages/Login';
import Register from './pages/Register';

// Dashboard
import Dashboard from './pages/Dashboard';

// Products
import ProductList   from './pages/Products/ProductList';
import AddProduct    from './pages/Products/AddProduct';
import EditProduct   from './pages/Products/EditProduct';
import ProductDetail from './pages/Products/ProductDetail';

// Customers
import CustomerList   from './pages/Customers/CustomerList';
import AddCustomer    from './pages/Customers/AddCustomer';
import EditCustomer   from './pages/Customers/EditCustomer';
import CustomerDetail from './pages/Customers/CustomerDetail';

// Sales / CSV Upload
import CSVUpload      from './pages/Sales/CSVUpload';
import UploadHistory  from './pages/Sales/UploadHistory';

// AI Insights
import AIInsights from './pages/AIInsights';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route element={<AuthLayout />}>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/"  element={<Dashboard />} />

              {/* Products */}
              <Route path="/products"            element={<ProductList />} />
              <Route path="/products/add"        element={<AddProduct />} />
              <Route path="/products/:id"        element={<ProductDetail />} />
              <Route path="/products/edit/:id"   element={<EditProduct />} />

              {/* Customers */}
              <Route path="/customers"           element={<CustomerList />} />
              <Route path="/customers/add"       element={<AddCustomer />} />
              <Route path="/customers/:id"       element={<CustomerDetail />} />
              <Route path="/customers/edit/:id"  element={<EditCustomer />} />

              {/* Sales / CSV Upload */}
              <Route path="/uploads"             element={<UploadHistory />} />
              <Route path="/uploads/new"         element={<CSVUpload />} />
              <Route path="/uploads/:id"         element={<UploadHistory />} />

              {/* AI Insights */}
              <Route path="/ai-insights"         element={<AIInsights />} />
            </Route>
          </Route>

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
        theme="light"
      />
    </AuthProvider>
  );
}

export default App;
