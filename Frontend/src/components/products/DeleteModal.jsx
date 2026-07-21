/**
 * DeleteModal.jsx
 * ---------------
 * Reusable confirmation modal for delete actions.
 * Uses Bootstrap modal via data-bs-* attributes — no JS import needed.
 *
 * Props:
 *   modalId    – unique id for the modal (used by trigger buttons)
 *   title      – modal heading
 *   message    – confirmation body text
 *   onConfirm  – async callback called when user clicks "Delete"
 *   loading    – bool, disables the button while deleting
 */
import React from 'react';

const DeleteModal = ({ modalId = 'deleteModal', title = 'Confirm Delete', message, onConfirm, loading }) => {
  return (
    <div
      className="modal fade"
      id={modalId}
      tabIndex="-1"
      aria-labelledby={`${modalId}Label`}
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div
          className="modal-content border-0"
          style={{
            background: 'rgba(15,23,42,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
          }}
        >
          {/* Header */}
          <div className="modal-header border-0 pb-0">
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                style={{
                  width: '44px', height: '44px',
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                }}
              >
                <i className="bi bi-trash3-fill" style={{ color: '#ef4444' }}></i>
              </div>
              <h5 className="modal-title fw-bold mb-0" id={`${modalId}Label`}>
                {title}
              </h5>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body py-4">
            <p className="text-secondary mb-0" style={{ lineHeight: '1.6' }}>
              {message || 'Are you sure you want to delete this item? This action cannot be undone.'}
            </p>
          </div>

          {/* Footer */}
          <div className="modal-footer border-0 pt-0 gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary rounded-3 px-4"
              data-bs-dismiss="modal"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn rounded-3 px-4 fw-semibold"
              style={{ background: '#ef4444', color: '#fff', border: 'none' }}
              onClick={onConfirm}
              disabled={loading}
              data-bs-dismiss={!loading ? 'modal' : undefined}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Deleting...
                </>
              ) : (
                <>
                  <i className="bi bi-trash3 me-2"></i>
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
