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
          background: isUser ? 'var(--accent)' : '#1e1e2e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '0.78rem',
          color: isUser ? '#1a1a1a' : '#f5c518',
          border: isUser ? '2px solid var(--accent)' : '2px solid #f5c51830',
          boxShadow: isUser ? '0 2px 8px rgba(245,197,24,0.25)' : '0 2px 8px rgba(0,0,0,0.15)',
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
              ? 'var(--accent)'
              : 'var(--bg-card)',
            border: isUser ? 'none' : '1px solid var(--border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            color: isUser ? '#1a1a1a' : 'var(--text-primary)',
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
