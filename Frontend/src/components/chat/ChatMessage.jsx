/**
 * ChatMessage.jsx
 * ---------------
 * Renders a single chat bubble — user or assistant.
 * Props: role ('user'|'assistant'), content, timestamp, onCopy
 */
import React, { useState } from 'react';

const ChatMessage = ({ role, content, timestamp, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const isUser = role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Format AI response — preserve newlines and bullet points
  const formatContent = (text) => {
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <br key={i} />;
      return (
        <span key={i} style={{ display: 'block', lineHeight: 1.7 }}>
          {trimmed}
        </span>
      );
    });
  };

  return (
    <div
      className={`d-flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      style={{ alignItems: 'flex-start' }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: isUser
            ? 'linear-gradient(135deg, #1a56db 0%, #0ea5e9 100%)'
            : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '0.78rem',
          color: '#ffffff',
          border: isUser ? '2px solid #1a56db' : '2px solid #1e293b',
          boxShadow: isUser ? '0 2px 8px rgba(26,86,219,0.3)' : '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        {isUser ? 'You' : <i className="bi bi-stars"></i>}
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: '78%', minWidth: 60 }}>
        <div
          style={{
            padding: '12px 16px',
            borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
            background: isUser
              ? 'linear-gradient(135deg, #1a56db 0%, #0ea5e9 100%)'
              : 'var(--bg-card)',
            border: isUser ? 'none' : '1px solid var(--border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            color: isUser ? '#ffffff' : 'var(--text-primary)',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            wordBreak: 'break-word',
          }}
        >
          {isUser ? content : formatContent(content)}
        </div>

        {/* Footer: timestamp + copy button */}
        <div
          className={`d-flex align-items-center gap-2 mt-1 ${isUser ? 'justify-content-end' : ''}`}
          style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: isUser ? 0 : 4 }}
        >
          <span>{timestamp}</span>
          {!isUser && (
            <button
              onClick={handleCopy}
              title="Copy response"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: copied ? '#22c55e' : 'var(--text-muted)',
                padding: '0 2px', fontSize: '0.72rem', lineHeight: 1,
              }}
            >
              <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'}`}></i>
              {copied ? ' Copied' : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
