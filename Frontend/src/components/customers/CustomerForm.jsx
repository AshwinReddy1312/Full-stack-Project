/**
 * CustomerForm.jsx
 * ----------------
 * Shared form used by AddCustomer and EditCustomer pages.
 * Handles image preview, all field validations, and API error surfacing.
 *
 * Props:
 *   onSubmit      – async (data) => void  (receives plain form data object)
 *   defaultValues – existing customer data (edit mode)
 *   submitting    – bool
 *   submitLabel   – string
 *   apiErrors     – { field: "msg" } from API
 */
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Singapore', 'UAE', 'Other',
];

const CustomerForm = ({
  onSubmit,
  defaultValues = {},
  submitting = false,
  submitLabel = 'Save Customer',
  apiErrors = {},
}) => {
  const [imagePreview, setImagePreview] = useState(null);

  const { register, handleSubmit, setValue, setError, watch, formState: { errors } } = useForm({
    defaultValues: { status: 'Active', customer_type: 'Individual', ...defaultValues },
  });

  const customerType = watch('customer_type');

  // Pre-fill existing image in edit mode
  useEffect(() => {
    if (defaultValues?.profile_image && typeof defaultValues.profile_image === 'string') {
      const src = defaultValues.profile_image.startsWith('http')
        ? defaultValues.profile_image
        : `${API_URL}${defaultValues.profile_image}`;
      setImagePreview(src);
    }
  }, [defaultValues?.profile_image]);

  // Surface API errors into RHF fields
  useEffect(() => {
    if (!apiErrors) return;
    Object.entries(apiErrors).forEach(([field, msg]) => {
      setError(field, { type: 'server', message: Array.isArray(msg) ? msg[0] : msg });
    });
  }, [apiErrors, setError]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue('profile_image', file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const fe = (name) => errors[name]?.message;
  const ic = (name) => `form-control${fe(name) ? ' is-invalid' : ''}`;
  const sc = (name) => `form-select${fe(name) ? ' is-invalid' : ''}`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="row g-4">

        {/* ── Left column ──────────────────────────────────────── */}
        <div className="col-lg-8">

          {/* Personal Info */}
          <div className="card-panel p-4 mb-4">
            <h6 className="fw-bold mb-4" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              <i className="bi bi-person me-2"></i>Personal Information
            </h6>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">First Name <span style={{ color: '#dc2626' }}>*</span></label>
                <input className={ic('first_name')} placeholder="John"
                  {...register('first_name', { required: 'First name is required' })} />
                {fe('first_name') && <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 3 }}><i className="bi bi-exclamation-circle me-1"></i>{fe('first_name')}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Last Name <span style={{ color: '#dc2626' }}>*</span></label>
                <input className={ic('last_name')} placeholder="Doe"
                  {...register('last_name', { required: 'Last name is required' })} />
                {fe('last_name') && <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 3 }}><i className="bi bi-exclamation-circle me-1"></i>{fe('last_name')}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Gender</label>
                <select className={sc('gender')} {...register('gender')}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Date of Birth</label>
                <input type="date" className={ic('date_of_birth')} {...register('date_of_birth')} />
              </div>
              <div className="col-12">
                <label className="form-label">Notes</label>
                <textarea rows={3} className={ic('notes')} placeholder="Any internal notes about this customer…" {...register('notes')} />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="card-panel p-4 mb-4">
            <h6 className="fw-bold mb-4" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              <i className="bi bi-telephone me-2"></i>Contact Information
            </h6>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Email Address <span style={{ color: '#dc2626' }}>*</span></label>
                <input type="email" className={ic('email')} placeholder="john@example.com"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
                  })} />
                {fe('email') && <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 3 }}><i className="bi bi-exclamation-circle me-1"></i>{fe('email')}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone Number <span style={{ color: '#dc2626' }}>*</span></label>
                <input className={ic('phone_number')} placeholder="+91 9999999999"
                  {...register('phone_number', { required: 'Phone number is required' })} />
                {fe('phone_number') && <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 3 }}><i className="bi bi-exclamation-circle me-1"></i>{fe('phone_number')}</div>}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="card-panel p-4 mb-4">
            <h6 className="fw-bold mb-4" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              <i className="bi bi-geo-alt me-2"></i>Address
            </h6>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label">Street Address</label>
                <input className={ic('address')} placeholder="123 Main Street" {...register('address')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">City</label>
                <input className={ic('city')} placeholder="Mumbai" {...register('city')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">State</label>
                <input className={ic('state')} placeholder="Maharashtra" {...register('state')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Country</label>
                <select className={sc('country')} {...register('country')}>
                  <option value="">Select country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Postal Code</label>
                <input className={ic('postal_code')} placeholder="400001" {...register('postal_code')} />
              </div>
            </div>
          </div>

          {/* Business */}
          <div className="card-panel p-4">
            <h6 className="fw-bold mb-4" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              <i className="bi bi-building me-2"></i>Business Information
            </h6>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Customer Type <span style={{ color: '#dc2626' }}>*</span></label>
                <select className={sc('customer_type')} {...register('customer_type', { required: 'Customer type is required' })}>
                  <option value="Individual">Individual</option>
                  <option value="Business">Business</option>
                </select>
                {fe('customer_type') && <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 3 }}>{fe('customer_type')}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">
                  Company Name {customerType === 'Business' && <span style={{ color: '#dc2626' }}>*</span>}
                </label>
                <input className={ic('company_name')} placeholder="Acme Corp"
                  {...register('company_name', {
                    validate: (val) => {
                      if (customerType === 'Business' && !val?.trim()) return 'Company name is required for Business customers';
                      return true;
                    },
                  })} />
                {fe('company_name') && <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 3 }}>{fe('company_name')}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Status</label>
                <select className="form-select" {...register('status')}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right column – Image ─────────────────────────────── */}
        <div className="col-lg-4">
          <div className="card-panel p-4 h-100">
            <h6 className="fw-bold mb-4" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              <i className="bi bi-person-circle me-2"></i>Profile Image
            </h6>

            {/* Preview */}
            <div style={{
              width: '100%', aspectRatio: '1/1',
              borderRadius: 16, overflow: 'hidden',
              background: 'var(--bg-secondary)',
              border: '2px dashed var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1rem',
            }}>
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="text-center" style={{ color: 'var(--text-muted)', padding: '2rem' }}>
                  <i className="bi bi-person-bounding-box" style={{ fontSize: '3rem', display: 'block', marginBottom: 8 }}></i>
                  <small>No image selected</small>
                </div>
              )}
            </div>

            <input type="file" accept="image/*" className="form-control" onChange={handleImageChange} />
            <small style={{ color: 'var(--text-muted)', marginTop: 6, display: 'block' }}>
              Supported: JPG, PNG. Max 5 MB.
            </small>
          </div>
        </div>

        {/* ── Submit ─────────────────────────────────────────────── */}
        <div className="col-12 d-flex justify-content-end gap-3 pt-2">
          <button type="button" className="btn btn-ghost px-4" onClick={() => window.history.back()}>
            <i className="bi bi-arrow-left me-2"></i>Cancel
          </button>
          <button type="submit" className="btn btn-accent px-5 py-2 fw-semibold" disabled={submitting}>
            {submitting
              ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</>
              : <><i className="bi bi-check-lg me-2"></i>{submitLabel}</>
            }
          </button>
        </div>
      </div>
    </form>
  );
};

export default CustomerForm;
