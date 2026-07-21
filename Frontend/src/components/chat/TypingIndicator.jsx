/**
 * TypingIndicator.jsx
 * -------------------
 * Animated three-dot typing indicator shown while the AI is generating a response.
 */
import React from 'react';

const TypingIndicator = () => (
  <div className="d-flex gap-3 mb-4 align-items-flex-start">
    {/* AI avatar */}
    <div style={{
      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
      background: '#1e1e2e', border: '2px solid #f5c51830',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#f5c518', fontSize: '0.9rem',
    }}>
      <i className="bi bi-stars"></i>
    </div>

    {/* Dots bubble */}
    <div style={{
      padding: '14px 18px',
      borderRadius: '4px 18px 18px 18px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'center', gap: 5,
    }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--accent)',
            display: 'inline-block',
            animation: 'typing-bounce 1.2s infinite ease-in-out',
            animationDelay: `${i * 0.2}s`,
          }}
        />
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
