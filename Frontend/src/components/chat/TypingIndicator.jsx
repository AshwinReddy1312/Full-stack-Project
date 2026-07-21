import React from 'react';

const TypingIndicator = () => (
  <div className="d-flex gap-3 mb-4 align-items-flex-start">
    <div style={{
      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #1a56db 0%, #0ea5e9 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: '0.9rem',
      boxShadow: '0 2px 8px rgba(26,86,219,0.3)',
    }}>
      <i className="bi bi-stars"></i>
    </div>
    <div style={{
      padding: '14px 18px',
      borderRadius: '4px 18px 18px 18px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'center', gap: 5,
    }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'linear-gradient(135deg, #1a56db, #0ea5e9)',
          display: 'inline-block',
          animation: 'typing-bounce 1.2s infinite ease-in-out',
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  </div>
);

export default TypingIndicator;
