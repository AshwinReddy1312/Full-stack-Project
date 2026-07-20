import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await login(data.email, data.password);
      if (res.success) {
        toast.success(res.message || 'Logged in successfully!');
        navigate('/');
      } else {
        toast.error(res.message || 'Login failed');
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-5 w-100 animate__animated animate__fadeIn" style={{ maxWidth: '450px' }}>
      <div className="text-center mb-4">
        <i className="bi bi-cpu-fill fs-1 mb-2" style={{ color: 'var(--accent-secondary)' }}></i>
        <h2 className="fw-bold mt-2">Welcome Back</h2>
        <p className="text-secondary">Sign in to your AI Business Dashboard</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Email Address */}
        <div className="mb-3">
          <label className="form-label fw-semibold text-secondary">Email Address</label>
          <div className="input-group">
            <span className="input-group-text bg-transparent border-end-0 text-secondary" style={{ borderColor: 'var(--card-border)' }}>
              <i className="bi bi-envelope"></i>
            </span>
            <input
              type="email"
              className={`form-control glass-input border-start-0 ${errors.email ? 'is-invalid' : ''}`}
              placeholder="name@example.com"
              {...register('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
          </div>
          {errors.email && (
            <div className="text-danger fs-7 mt-1" style={{ fontSize: '0.8rem' }}>{errors.email.message}</div>
          )}
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="form-label fw-semibold text-secondary">Password</label>
          <div className="input-group">
            <span className="input-group-text bg-transparent border-end-0 text-secondary" style={{ borderColor: 'var(--card-border)' }}>
              <i className="bi bi-shield-lock"></i>
            </span>
            <input
              type="password"
              className={`form-control glass-input border-start-0 ${errors.password ? 'is-invalid' : ''}`}
              placeholder="••••••••"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters long',
                },
              })}
            />
          </div>
          {errors.password && (
            <div className="text-danger fs-7 mt-1" style={{ fontSize: '0.8rem' }}>{errors.password.message}</div>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="btn btn-glow w-100 mb-3"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="text-center mt-3">
        <span className="text-secondary">Don't have an account? </span>
        <Link to="/register" className="text-decoration-none fw-semibold" style={{ color: 'var(--accent-secondary)' }}>
          Create one now
        </Link>
      </div>
    </div>
  );
};

export default Login;
