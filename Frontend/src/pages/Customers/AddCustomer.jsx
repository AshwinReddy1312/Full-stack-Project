/**
 * AddCustomer.jsx
 * ---------------
 * Page for creating a new customer.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createCustomer } from '../../services/customerService';
import CustomerForm from '../../components/customers/CustomerForm';

const AddCustomer = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [apiErrors, setApiErrors]   = useState({});

  const handleSubmit = async (data) => {
    setSubmitting(true);
    setApiErrors({});
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, value);
        }
      });

      const res = await createCustomer(formData);
      if (res.data?.success) {
        toast.success(res.data.message || 'Customer added successfully!');
        navigate('/customers');
      } else {
        toast.error(res.data?.message || 'Failed to create customer.');
      }
    } catch (err) {
      const errors = err.response?.data?.errors || {};
      setApiErrors(errors);
      toast.error(err.response?.data?.message || 'Validation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <button
          className="btn btn-ghost btn-sm px-3"
          onClick={() => navigate('/customers')}
        >
          <i className="bi bi-arrow-left me-2"></i>Back
        </button>
        <div>
          <h4 style={{ fontWeight: 800, marginBottom: 2 }}>Add New Customer</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Fill in the details to register a new customer
          </p>
        </div>
      </div>

      <CustomerForm
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Create Customer"
        apiErrors={apiErrors}
        defaultValues={{ status: 'Active', customer_type: 'Individual' }}
      />
    </div>
  );
};

export default AddCustomer;
