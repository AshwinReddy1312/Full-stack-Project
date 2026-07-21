import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await login(data.email, data.password);
      if (res.success) {
        toast.success('Welcome back!');
        navigate('/');
      } else {
        toast.error(res.message || 'Invalid credentials');
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card" style={{ maxWidth: 440 }}>
      <div className="text-center mb-4">
        <h2 style={{ fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
          Welcome back
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Sign in to your <span style={{ background: 'linear-gradient(135deg, #1a56db, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700 }}>InsightIQ</span> account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Email */}
        <div className="mb-3">
          <label className="form-label">Email Address</label>
          <div className="input-group">
            <span className="input-group-text" style={{ borderRight: 'none' }}>
              <i className="bi bi-envelope" style={{ fontSize: '0.875rem' }}></i>
            </span>
            <input
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              style={{ borderLeft: 'none' }}
              placeholder="you@example.com"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
              })}
            />
          </div>
          {errors.email && (
            <div style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: 4 }}>
              <i className="bi bi-exclamation-circle me-1"></i>{errors.email.message}
            </div>
          )}
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="form-label">Password</label>
          <div className="input-group">
            <span className="input-group-text" style={{ borderRight: 'none' }}>
              <i className="bi bi-lock" style={{ fontSize: '0.875rem' }}></i>
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              style={{ borderLeft: 'none', borderRight: 'none' }}
              placeholder="••••••••"
              {...register('password', { required: 'Password is required' })}
            />
            <button
              type="button"
              className="input-group-text"
              style={{ borderLeft: 'none', cursor: 'pointer', background: 'var(--bg-card)' }}
              onClick={() => setShowPassword(!showPassword)}
            >
              <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '0.875rem' }}></i>
            </button>
          </div>
          {errors.password && (
            <div style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: 4 }}>
              <i className="bi bi-exclamation-circle me-1"></i>{errors.password.message}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-accent w-100 py-2 mb-3"
          style={{ borderRadius: 10, fontSize: '0.9rem' }}
          disabled={submitting}
        >
          {submitting ? (
            <><span className="spinner-border spinner-border-sm me-2"></span>Signing in…</>
          ) : (
            <><i className="bi bi-arrow-right-circle me-2"></i>Sign In</>
          )}
        </button>
      </form>

      <div className="text-center" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>
          Create one
        </Link>
      </div>
    </div>
  );
};

export default Login;
