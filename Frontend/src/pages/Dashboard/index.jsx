import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Profile Edit Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    setValue: setProfileValue,
    formState: { errors: profileErrors }
  } = useForm({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone_number: user?.phone_number || ''
    }
  });

  // Password Change Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch: watchPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors }
  } = useForm();

  const newPassword = watchPassword('new_password');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileValue('profile_image', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onProfileSubmit = async (data) => {
    setSubmittingProfile(true);
    try {
      const res = await updateProfile(data);
      if (res.success) {
        toast.success(res.message || 'Profile updated successfully!');
      } else {
        toast.error(res.message || 'Update failed');
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
    } finally {
      setSubmittingProfile(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setSubmittingPassword(true);
    try {
      const res = await changePassword(data.old_password, data.new_password, data.new_password_confirm);
      if (res.success) {
        toast.success(res.message || 'Password changed successfully!');
        resetPasswordForm();
      } else {
        if (res.errors) {
          Object.keys(res.errors).forEach((key) => {
            const val = res.errors[key];
            const msg = Array.isArray(val) ? val[0] : val;
            toast.error(`${key}: ${msg}`);
          });
        } else {
          toast.error(res.message || 'Password change failed');
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
    } finally {
      setSubmittingPassword(false);
    }
  };

  const getProfileImage = () => {
    if (imagePreview) return imagePreview;
    if (user?.profile_image) {
      if (user.profile_image.startsWith('http')) {
        return user.profile_image;
      }
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      return `${baseUrl}${user.profile_image}`;
    }
    return 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="row g-4 animate__animated animate__fadeIn">
      {/* Profile Overview Card */}
      <div className="col-lg-4">
        <div className="glass-panel p-4 text-center">
          <div className="position-relative d-inline-block mb-3">
            <img
              src={getProfileImage()}
              alt="Profile"
              className="rounded-circle border border-indigo"
              style={{ width: '130px', height: '130px', objectFit: 'cover', borderWidth: '3px', borderColor: 'var(--accent-primary)' }}
            />
            <span className="position-absolute bottom-0 end-0 badge rounded-pill px-3 py-2 border border-dark" style={{ background: 'var(--accent-primary)' }}>
              {user?.role}
            </span>
          </div>

          <h3 className="fw-bold mb-1">{user?.first_name} {user?.last_name}</h3>
          <p className="text-secondary mb-3">@{user?.username}</p>

          <hr className="border-secondary border-opacity-10 my-4" />

          <div className="text-start">
            <div className="mb-3">
              <small className="text-secondary d-block">Email Address</small>
              <span className="fw-semibold">{user?.email}</span>
            </div>
            <div className="mb-3">
              <small className="text-secondary d-block">Phone Number</small>
              <span className="fw-semibold">{user?.phone_number || 'Not Provided'}</span>
            </div>
            <div className="mb-3">
              <small className="text-secondary d-block">Joined On</small>
              <span className="fw-semibold text-secondary" style={{ fontSize: '0.9rem' }}>{formatDate(user?.created_at)}</span>
            </div>
            <div className="mb-0">
              <small className="text-secondary d-block">Last Updated</small>
              <span className="fw-semibold text-secondary" style={{ fontSize: '0.9rem' }}>{formatDate(user?.updated_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Editing panels */}
      <div className="col-lg-8">
        <div className="row g-4">
          {/* Update Profile Form */}
          <div className="col-12">
            <div className="glass-panel p-4">
              <h4 className="fw-bold mb-3"><i className="bi bi-person-gear me-2"></i>Edit Profile Details</h4>
              <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold text-secondary">First Name</label>
                    <input
                      type="text"
                      className={`form-control glass-input ${profileErrors.first_name ? 'is-invalid' : ''}`}
                      placeholder="John"
                      {...registerProfile('first_name', { required: 'First name is required' })}
                    />
                    {profileErrors.first_name && (
                      <div className="text-danger fs-7 mt-1" style={{ fontSize: '0.8rem' }}>{profileErrors.first_name.message}</div>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold text-secondary">Last Name</label>
                    <input
                      type="text"
                      className={`form-control glass-input ${profileErrors.last_name ? 'is-invalid' : ''}`}
                      placeholder="Doe"
                      {...registerProfile('last_name', { required: 'Last name is required' })}
                    />
                    {profileErrors.last_name && (
                      <div className="text-danger fs-7 mt-1" style={{ fontSize: '0.8rem' }}>{profileErrors.last_name.message}</div>
                    )}
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold text-secondary">Phone Number</label>
                    <input
                      type="text"
                      className="form-control glass-input"
                      placeholder="+1234567890"
                      {...registerProfile('phone_number')}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold text-secondary">Change Profile Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-control glass-input"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-glow mt-2" disabled={submittingProfile}>
                  {submittingProfile ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Details'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="col-12">
            <div className="glass-panel p-4">
              <h4 className="fw-bold mb-3"><i className="bi bi-shield-key me-2"></i>Change Security Password</h4>
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
                <div className="mb-3">
                  <label className="form-label fw-semibold text-secondary">Current Password</label>
                  <input
                    type="password"
                    className={`form-control glass-input ${passwordErrors.old_password ? 'is-invalid' : ''}`}
                    placeholder="••••••••"
                    {...registerPassword('old_password', { required: 'Current password is required' })}
                  />
                  {passwordErrors.old_password && (
                    <div className="text-danger fs-7 mt-1" style={{ fontSize: '0.8rem' }}>{passwordErrors.old_password.message}</div>
                  )}
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold text-secondary">New Password</label>
                    <input
                      type="password"
                      className={`form-control glass-input ${passwordErrors.new_password ? 'is-invalid' : ''}`}
                      placeholder="••••••••"
                      {...registerPassword('new_password', {
                        required: 'New password is required',
                        minLength: {
                          value: 8,
                          message: 'Must be at least 8 characters long',
                        },
                      })}
                    />
                    {passwordErrors.new_password && (
                      <div className="text-danger fs-7 mt-1" style={{ fontSize: '0.8rem' }}>{passwordErrors.new_password.message}</div>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold text-secondary">Confirm New Password</label>
                    <input
                      type="password"
                      className={`form-control glass-input ${passwordErrors.new_password_confirm ? 'is-invalid' : ''}`}
                      placeholder="••••••••"
                      {...registerPassword('new_password_confirm', {
                        required: 'Please confirm your new password',
                        validate: (value) => value === newPassword || 'Passwords do not match',
                      })}
                    />
                    {passwordErrors.new_password_confirm && (
                      <div className="text-danger fs-7 mt-1" style={{ fontSize: '0.8rem' }}>{passwordErrors.new_password_confirm.message}</div>
                    )}
                  </div>
                </div>

                <button type="submit" className="btn btn-glow mt-2" disabled={submittingPassword}>
                  {submittingPassword ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Updating Password...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
