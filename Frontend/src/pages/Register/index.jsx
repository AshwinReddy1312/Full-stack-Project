import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  // Stores field-level errors returned from the API
  const [apiErrors, setApiErrors] = useState({});

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm({ defaultValues: { role: 'Employee' } });

  const password = watch('password');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue('profile_image', file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  /**
   * Maps API error keys back into React Hook Form fields so errors
   * appear inline under the correct input instead of just as toasts.
   */
  const applyApiErrors = (errors) => {
    setApiErrors(errors);
    const knownFields = [
      'username', 'email', 'first_name', 'last_name',
      'phone_number', 'role', 'password', 'password_confirm', 'profile_image',
    ];
    knownFields.forEach((field) => {
      if (errors[field]) {
        const msg = Array.isArray(errors[field]) ? errors[field][0] : errors[field];
        setError(field, { type: 'server', message: msg });
      }
    });

    // Show non-field errors as a toast
    const nonFieldKeys = Object.keys(errors).filter((k) => !knownFields.includes(k));
    nonFieldKeys.forEach((key) => {
      const val = errors[key];
      const msg = Array.isArray(val) ? val[0] : String(val);
      toast.error(msg);
    });
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    setApiErrors({});
    try {
      const res = await registerUser(data);
      if (res.success) {
        toast.success(res.message || 'Registration successful! Please login.');
        navigate('/login');
      } else {
        if (res.errors && Object.keys(res.errors).length > 0) {
          applyApiErrors(res.errors);
          toast.error('Please fix the errors below and try again.');
        } else {
          toast.error(res.message || 'Registration failed');
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to get error message for a field (local or API)
  const fieldError = (name) => errors[name]?.message;

  return (
    <div
      className="glass-panel p-4 p-md-5 w-100"
      style={{ maxWidth: '620px' }}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
          style={{
            width: '64px', height: '64px',
            background: 'linear-gradient(135deg, rgba(79,70,229,0.25) 0%, rgba(6,182,212,0.15) 100%)',
            border: '1px solid rgba(79,70,229,0.3)',
          }}
        >
          <i className="bi bi-person-plus-fill fs-3" style={{ color: 'var(--accent-secondary)' }}></i>
        </div>
        <h2 className="fw-bold mb-1">Create Account</h2>
        <p className="text-secondary mb-0" style={{ fontSize: '0.9rem' }}>
          Join the AI Business Dashboard workspace
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Row 1 – First Name / Last Name */}
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold text-secondary small">
              First Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control glass-input ${fieldError('first_name') ? 'is-invalid border-danger' : ''}`}
              placeholder="John"
              {...register('first_name', { required: 'First name is required' })}
            />
            {fieldError('first_name') && (
              <div className="mt-1" style={{ fontSize: '0.78rem', color: '#f87171' }}>
                <i className="bi bi-exclamation-circle me-1"></i>
                {fieldError('first_name')}
              </div>
            )}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold text-secondary small">
              Last Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control glass-input ${fieldError('last_name') ? 'is-invalid border-danger' : ''}`}
              placeholder="Doe"
              {...register('last_name', { required: 'Last name is required' })}
            />
            {fieldError('last_name') && (
              <div className="mt-1" style={{ fontSize: '0.78rem', color: '#f87171' }}>
                <i className="bi bi-exclamation-circle me-1"></i>
                {fieldError('last_name')}
              </div>
            )}
          </div>
        </div>

        {/* Row 2 – Username / Email */}
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold text-secondary small">
              Username <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span
                className="input-group-text bg-transparent border-end-0 text-secondary"
                style={{ borderColor: 'var(--card-border)' }}
              >
                <i className="bi bi-at"></i>
              </span>
              <input
                type="text"
                className={`form-control glass-input border-start-0 ${fieldError('username') ? 'is-invalid border-danger' : ''}`}
                placeholder="johndoe"
                {...register('username', {
                  required: 'Username is required',
                  minLength: { value: 3, message: 'Username must be at least 3 characters' },
                  pattern: {
                    value: /^[a-zA-Z0-9._@+-]+$/,
                    message: 'Only letters, numbers, and @/./+/-/_ are allowed',
                  },
                })}
              />
            </div>
            {fieldError('username') && (
              <div className="mt-1" style={{ fontSize: '0.78rem', color: '#f87171' }}>
                <i className="bi bi-exclamation-circle me-1"></i>
                {fieldError('username')}
              </div>
            )}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold text-secondary small">
              Email Address <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span
                className="input-group-text bg-transparent border-end-0 text-secondary"
                style={{ borderColor: 'var(--card-border)' }}
              >
                <i className="bi bi-envelope"></i>
              </span>
              <input
                type="email"
                className={`form-control glass-input border-start-0 ${fieldError('email') ? 'is-invalid border-danger' : ''}`}
                placeholder="john@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
            </div>
            {fieldError('email') && (
              <div className="mt-1" style={{ fontSize: '0.78rem', color: '#f87171' }}>
                <i className="bi bi-exclamation-circle me-1"></i>
                {fieldError('email')}
              </div>
            )}
          </div>
        </div>

        {/* Row 3 – Phone / Role */}
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold text-secondary small">Phone Number</label>
            <div className="input-group">
              <span
                className="input-group-text bg-transparent border-end-0 text-secondary"
                style={{ borderColor: 'var(--card-border)' }}
              >
                <i className="bi bi-telephone"></i>
              </span>
              <input
                type="text"
                className={`form-control glass-input border-start-0 ${fieldError('phone_number') ? 'is-invalid border-danger' : ''}`}
                placeholder="+1234567890"
                {...register('phone_number')}
              />
            </div>
            {fieldError('phone_number') && (
              <div className="mt-1" style={{ fontSize: '0.78rem', color: '#f87171' }}>
                <i className="bi bi-exclamation-circle me-1"></i>
                {fieldError('phone_number')}
              </div>
            )}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold text-secondary small">
              Workspace Role <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select glass-input glass-select ${fieldError('role') ? 'is-invalid border-danger' : ''}`}
              {...register('role', { required: 'Role is required' })}
            >
              <option value="Employee">Employee</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>
            {fieldError('role') && (
              <div className="mt-1" style={{ fontSize: '0.78rem', color: '#f87171' }}>
                <i className="bi bi-exclamation-circle me-1"></i>
                {fieldError('role')}
              </div>
            )}
          </div>
        </div>

        {/* Row 4 – Password / Confirm */}
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold text-secondary small">
              Password <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span
                className="input-group-text bg-transparent border-end-0 text-secondary"
                style={{ borderColor: 'var(--card-border)' }}
              >
                <i className="bi bi-shield-lock"></i>
              </span>
              <input
                type="password"
                className={`form-control glass-input border-start-0 ${fieldError('password') ? 'is-invalid border-danger' : ''}`}
                placeholder="Min. 8 characters"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Must be at least 8 characters' },
                })}
              />
            </div>
            {fieldError('password') && (
              <div className="mt-1" style={{ fontSize: '0.78rem', color: '#f87171' }}>
                <i className="bi bi-exclamation-circle me-1"></i>
                {fieldError('password')}
              </div>
            )}
            {/* Password strength hint */}
            {!fieldError('password') && (
              <div className="mt-1" style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                <i className="bi bi-info-circle me-1"></i>
                Use letters, numbers &amp; symbols. Avoid common words.
              </div>
            )}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold text-secondary small">
              Confirm Password <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span
                className="input-group-text bg-transparent border-end-0 text-secondary"
                style={{ borderColor: 'var(--card-border)' }}
              >
                <i className="bi bi-shield-check"></i>
              </span>
              <input
                type="password"
                className={`form-control glass-input border-start-0 ${fieldError('password_confirm') ? 'is-invalid border-danger' : ''}`}
                placeholder="Re-enter password"
                {...register('password_confirm', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                })}
              />
            </div>
            {fieldError('password_confirm') && (
              <div className="mt-1" style={{ fontSize: '0.78rem', color: '#f87171' }}>
                <i className="bi bi-exclamation-circle me-1"></i>
                {fieldError('password_confirm')}
              </div>
            )}
          </div>
        </div>

        {/* Profile Image */}
        <div className="mb-4">
          <label className="form-label fw-semibold text-secondary small">Profile Image</label>
          <div className="d-flex align-items-center gap-3">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="rounded-circle flex-shrink-0"
                style={{
                  width: '56px', height: '56px', objectFit: 'cover',
                  border: '2px solid var(--accent-primary)',
                }}
              />
            ) : (
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: '56px', height: '56px',
                  background: 'rgba(15,23,42,0.5)',
                  border: '2px dashed var(--card-border)',
                }}
              >
                <i className="bi bi-camera text-secondary"></i>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="form-control glass-input"
              onChange={handleImageChange}
            />
          </div>
          {fieldError('profile_image') && (
            <div className="mt-1" style={{ fontSize: '0.78rem', color: '#f87171' }}>
              <i className="bi bi-exclamation-circle me-1"></i>
              {fieldError('profile_image')}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-glow w-100 py-2 mb-3"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Creating Account...
            </>
          ) : (
            <>
              <i className="bi bi-person-check me-2"></i>
              Create Account
            </>
          )}
        </button>
      </form>

      <div className="text-center">
        <span className="text-secondary small">Already have an account? </span>
        <Link
          to="/login"
          className="text-decoration-none fw-semibold small"
          style={{ color: 'var(--accent-secondary)' }}
        >
          Sign in
        </Link>
      </div>
    </div>
  );
};

export default Register;
