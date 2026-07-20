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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      role: 'Employee'
    }
  });

  const password = watch('password');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue('profile_image', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await registerUser(data);
      if (res.success) {
        toast.success(res.message || 'Registration successful! Please login.');
        navigate('/login');
      } else {
        if (res.errors) {
          Object.keys(res.errors).forEach((key) => {
            const val = res.errors[key];
            const msg = Array.isArray(val) ? val[0] : val;
            toast.error(`${key}: ${msg}`);
          });
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

  return (
    <div className="glass-panel p-5 w-100 animate__animated animate__fadeIn" style={{ maxWidth: '600px' }}>
      <div className="text-center mb-4">
        <i className="bi bi-person-plus-fill fs-1 mb-2" style={{ color: 'var(--accent-secondary)' }}></i>
        <h2 className="fw-bold mt-2">Create Account</h2>
        <p className="text-secondary">Join our AI-powered business workspace</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="row">
          {/* First Name */}
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold text-secondary">First Name</label>
            <input
              type="text"
              className={`form-control glass-input ${errors.first_name ? 'is-invalid' : ''}`}
              placeholder="John"
              {...register('first_name', { required: 'First name is required' })}
            />
            {errors.first_name && (
              <div className="text-danger fs-7 mt-1" style={{ fontSize: '0.8rem' }}>{errors.first_name.message}</div>
            )}
          </div>

          {/* Last Name */}
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold text-secondary">Last Name</label>
            <input
              type="text"
              className={`form-control glass-input ${errors.last_name ? 'is-invalid' : ''}`}
              placeholder="Doe"
              {...register('last_name', { required: 'Last name is required' })}
            />
            {errors.last_name && (
              <div className="text-danger fs-7 mt-1" style={{ fontSize: '0.8rem' }}>{errors.last_name.message}</div>
            )}
          </div>
        </div>

        <div className="row">
          {/* Username */}
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold text-secondary">Username</label>
            <input
              type="text"
              className={`form-control glass-input ${errors.username ? 'is-invalid' : ''}`}
              placeholder="johndoe"
              {...register('username', { required: 'Username is required' })}
            />
            {errors.username && (
              <div className="text-danger fs-7 mt-1" style={{ fontSize: '0.8rem' }}>{errors.username.message}</div>
            )}
          </div>

          {/* Email */}
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold text-secondary">Email Address</label>
            <input
              type="email"
              className={`form-control glass-input ${errors.email ? 'is-invalid' : ''}`}
              placeholder="john@example.com"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
            {errors.email && (
              <div className="text-danger fs-7 mt-1" style={{ fontSize: '0.8rem' }}>{errors.email.message}</div>
            )}
          </div>
        </div>

        <div className="row">
          {/* Phone Number */}
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold text-secondary">Phone Number</label>
            <input
              type="text"
              className={`form-control glass-input ${errors.phone_number ? 'is-invalid' : ''}`}
              placeholder="+1234567890"
              {...register('phone_number')}
            />
          </div>

          {/* Role selection dropdown */}
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold text-secondary">Workspace Role</label>
            <select
              className={`form-select glass-input glass-select ${errors.role ? 'is-invalid' : ''}`}
              {...register('role', { required: 'Workspace role is required' })}
            >
              <option value="Employee">Employee</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="row">
          {/* Password */}
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold text-secondary">Password</label>
            <input
              type="password"
              className={`form-control glass-input ${errors.password ? 'is-invalid' : ''}`}
              placeholder="••••••••"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Must be at least 8 characters long',
                },
              })}
            />
            {errors.password && (
              <div className="text-danger fs-7 mt-1" style={{ fontSize: '0.8rem' }}>{errors.password.message}</div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold text-secondary">Confirm Password</label>
            <input
              type="password"
              className={`form-control glass-input ${errors.password_confirm ? 'is-invalid' : ''}`}
              placeholder="••••••••"
              {...register('password_confirm', {
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match',
              })}
            />
            {errors.password_confirm && (
              <div className="text-danger fs-7 mt-1" style={{ fontSize: '0.8rem' }}>{errors.password_confirm.message}</div>
            )}
          </div>
        </div>

        {/* Profile Image upload */}
        <div className="mb-4">
          <label className="form-label fw-semibold text-secondary">Profile Image</label>
          <div className="d-flex align-items-center gap-3">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="rounded-circle border"
                style={{ width: '60px', height: '60px', objectFit: 'cover', borderColor: 'var(--card-border)' }}
              />
            ) : (
              <div className="rounded-circle d-flex align-items-center justify-content-center border" style={{ width: '60px', height: '60px', background: 'rgba(15,23,42,0.4)', borderColor: 'var(--card-border)' }}>
                <i className="bi bi-camera text-secondary fs-4"></i>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="form-control glass-input flex-grow-1"
              onChange={handleImageChange}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-glow w-100 mb-3"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Creating Account...
            </>
          ) : (
            'Register'
          )}
        </button>
      </form>

      <div className="text-center mt-3">
        <span className="text-secondary">Already have an account? </span>
        <Link to="/login" className="text-decoration-none fw-semibold" style={{ color: 'var(--accent-secondary)' }}>
          Sign in
        </Link>
      </div>
    </div>
  );
};

export default Register;
