/**
 * EditCustomer.jsx
 * ----------------
 * Pre-fills CustomerForm with existing customer data then PUTs changes.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getCustomer, updateCustomer } from '../../services/customerService';
import CustomerForm from '../../components/customers/CustomerForm';

const EditCustomer = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiErrors, setApiErrors] = useState({});

  useEffect(() => {
    getCustomer(id)
      .then((res) => setCustomer(res.data?.data || null))
      .catch(() => { toast.error('Customer not found.'); navigate('/customers'); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data) => {
    setSubmitting(true);
    setApiErrors({});
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        // Skip image field if unchanged (still a URL string)
        if (key === 'profile_image' && typeof value === 'string') return;
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, value);
        }
      });

      const res = await updateCustomer(id, formData);
      if (res.data?.success) {
        toast.success(res.data.message || 'Customer updated successfully!');
        navigate(`/customers/${id}`);
      } else {
        toast.error(res.data?.message || 'Failed to update customer.');
      }
    } catch (err) {
      const errors = err.response?.data?.errors || {};
      setApiErrors(errors);
      toast.error(err.response?.data?.message || 'Validation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: 'var(--accent)', width: '2rem', height: '2rem' }}></div>
      </div>
    );
  }
  if (!customer) return null;

  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-ghost btn-sm px-3" onClick={() => navigate(`/customers/${id}`)}>
          <i className="bi bi-arrow-left me-2"></i>Back
        </button>
        <div>
          <h4 style={{ fontWeight: 800, marginBottom: 2 }}>Edit Customer</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            {customer.full_name} — {customer.customer_id}
          </p>
        </div>
      </div>

      <CustomerForm
        onSubmit={handleSubmit}
        defaultValues={{
          first_name:    customer.first_name,
          last_name:     customer.last_name,
          gender:        customer.gender        || '',
          date_of_birth: customer.date_of_birth || '',
          email:         customer.email,
          phone_number:  customer.phone_number,
          address:       customer.address       || '',
          city:          customer.city          || '',
          state:         customer.state         || '',
          country:       customer.country       || '',
          postal_code:   customer.postal_code   || '',
          customer_type: customer.customer_type,
          company_name:  customer.company_name  || '',
          status:        customer.status,
          notes:         customer.notes         || '',
          profile_image: customer.profile_image || '',
        }}
        submitting={submitting}
        submitLabel="Save Changes"
        apiErrors={apiErrors}
      />
    </div>
  );
};

export default EditCustomer;
