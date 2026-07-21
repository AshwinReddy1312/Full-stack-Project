/**
 * Pagination.jsx
 * --------------
 * Generic pagination bar component.
 *
 * Props:
 *   currentPage  – active page number (1-based)
 *   totalPages   – total number of pages
 *   totalCount   – total records (for "Showing X of Y" label)
 *   pageSize     – records per page
 *   onPageChange – (page: number) => void
 */
import React from 'react';

const Pagination = ({ currentPage, totalPages, totalCount, pageSize, onPageChange }) => {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  // Build page number array with ellipsis logic
  const buildPages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  return (
    <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 mt-4">
      {/* Record count */}
      <small className="text-secondary">
        Showing <span className="fw-semibold text-white">{start}–{end}</span> of{' '}
        <span className="fw-semibold text-white">{totalCount}</span> products
      </small>

      {/* Page buttons */}
      <nav aria-label="Product pagination">
        <ul className="pagination pagination-sm mb-0 gap-1">
          {/* Prev */}
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link rounded-3 border-0"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <i className="bi bi-chevron-left"></i>
            </button>
          </li>

          {buildPages().map((page, idx) =>
            page === '...' ? (
              <li key={`ellipsis-${idx}`} className="page-item disabled">
                <span
                  className="page-link border-0"
                  style={{ background: 'transparent', color: '#64748b' }}
                >
                  …
                </span>
              </li>
            ) : (
              <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                <button
                  className="page-link rounded-3 border-0 fw-semibold"
                  style={
                    page === currentPage
                      ? { background: 'var(--accent-primary)', color: '#fff' }
                      : { background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }
                  }
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </button>
              </li>
            )
          )}

          {/* Next */}
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button
              className="page-link rounded-3 border-0"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Pagination;
