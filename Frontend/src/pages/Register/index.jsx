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
  const [apiErrors, setApiErrors] = useState({});

  const {
    register, handleSubmit, watch, setValue, setError,
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

  const applyApiErrors = (errs) => {
    setApiErrors(errs);
    const known = ['username','email','first_name','last_name','phone_number','role','password','password_confirm'];
    known.forEach((f) => {
      if (errs[f]) setError(f, { type: 'server', message: Array.isArray(errs[f]) ? errs[f][0] : errs[f] });
    });
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    setApiErrors({});
    try {
      const res = await registerUser(data);
      if (res.success) {
        toast.success('Account created! Please sign in.');
        navigate('/login');
      } else {
        if (res.errors) { applyApiErrors(res.errors); toast.error('Please fix the errors below.'); }
        else toast.error(res.message || 'Registration failed');
      }
    } catch { toast.error('An unexpected error occurred.'); }
    finally { setSubmitting(false); }
  };

  const fe = (n) => errors[n]?.message;
  const ic = (n) => `form-control${fe(n) ? ' is-invalid' : ''}`;

  return (
    <div className="auth-card" style={{ maxWidth: 580 }}>
      <div className="text-center mb-4">
        <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
          Create Account
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Join the AI Business Dashboard workspace
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Row 1 – names */}
        <div className="row g-3 mb-3">
          <div className="col-6">
            <label className="form-label">First Name <span style={{ color: '#dc2626' }}>*</span></label>
            <input className={ic('first_name')} placeholder="John"
              {...register('first_name', { required: 'Required' })} />
            {fe('first_name') && <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 3 }}>{fe('first_name')}</div>}
          </div>
          <div className="col-6">
            <label className="form-label">Last Name <span style={{ color: '#dc2626' }}>*</span></label>
            <input className={ic('last_name')} placeholder="Doe"
              {...register('last_name', { required: 'Required' })} />
            {fe('last_name') && <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 3 }}>{fe('last_name')}</div>}
          </div>
        </div>

        {/* Row 2 – username + email */}
        <div className="row g-3 mb-3">
          <div className="col-6">
            <label className="form-label">Username <span style={{ color: '#dc2626' }}>*</span></label>
            <input className={ic('username')} placeholder="johndoe"
              {...register('username', { required: 'Required', minLength: { value: 3, message: 'Min 3 chars' } })} />
            {fe('username') && <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 3 }}>{fe('username')}</div>}
          </div>
          <div className="col-6">
            <label className="form-label">Email <span style={{ color: '#dc2626' }}>*</span></label>
            <input type="email" className={ic('email')} placeholder="you@example.com"
              {...register('email', { required: 'Required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })} />
            {fe('email') && <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 3 }}>{fe('email')}</div>}
          </div>
        </div>

        {/* Row 3 – phone + role */}
        <div className="row g-3 mb-3">
          <div className="col-6">
            <label className="form-label">Phone Number</label>
            <input className="form-control" placeholder="+91 9999999999" {...register('phone_number')} />
          </div>
          <div className="col-6">
            <label className="form-label">Role <span style={{ color: '#dc2626' }}>*</span></label>
            <select className="form-select" {...register('role', { required: 'Required' })}>
              <option value="Employee">Employee</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Row 4 – passwords */}
        <div className="row g-3 mb-3">
          <div className="col-6">
            <label className="form-label">Password <span style={{ color: '#dc2626' }}>*</span></label>
            <input type="password" className={ic('password')} placeholder="Min. 8 characters"
              {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })} />
            {fe('password') && <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 3 }}>{fe('password')}</div>}
            {!fe('password') && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>Avoid common words or numbers only</div>}
          </div>
          <div className="col-6">
            <label className="form-label">Confirm Password <span style={{ color: '#dc2626' }}>*</span></label>
            <input type="password" className={ic('password_confirm')} placeholder="Re-enter password"
              {...register('password_confirm', { required: 'Required', validate: v => v === password || 'Passwords do not match' })} />
            {fe('password_confirm') && <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 3 }}>{fe('password_confirm')}</div>}
          </div>
        </div>

        {/* Profile image */}
        <div className="mb-4">
          <label className="form-label">Profile Image</label>
          <div className="d-flex align-items-center gap-3">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="avatar avatar-md flex-shrink-0" />
            ) : (
              <div className="avatar avatar-md flex-shrink-0 d-flex align-items-center justify-content-center"
                style={{ background: 'var(--accent-light)', border: '2px dashed var(--accent)' }}>
                <i className="bi bi-camera" style={{ color: 'var(--accent)', fontSize: '1.1rem' }}></i>
              </div>
            )}
            <input type="file" accept="image/*" className="form-control" onChange={handleImageChange} />
          </div>
        </div>

        <button type="submit" className="btn btn-accent w-100 py-2 mb-3"
          style={{ borderRadius: 10, fontSize: '0.9rem' }} disabled={submitting}>
          {submitting
            ? <><span className="spinner-border spinner-border-sm me-2"></span>Creating account…</>
            : <><i className="bi bi-person-check me-2"></i>Create Account</>}
        </button>
      </form>

      <div className="text-center" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--text-primary)', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
      </div>
    </div>
  );
};

export default Register;
