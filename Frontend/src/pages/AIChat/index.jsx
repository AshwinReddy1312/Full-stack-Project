/**
 * AIChat/index.jsx
 * ----------------
 * Full AI Chat Assistant page.
 *
 * Features:
 * - Chat interface with user + AI bubbles
 * - Conversation memory within session
 * - Suggested starter questions
 * - Executive Summary generator
 * - Clear chat
 * - Auto-scroll to latest message
 * - Typing indicator
 * - Copy response button
 * - Timestamps
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { sendChatMessage, generateExecutiveSummary } from '../../services/aiService';
import ChatMessage    from '../../components/chat/ChatMessage';
import TypingIndicator from '../../components/chat/TypingIndicator';

// ── Suggested questions ───────────────────────────────────────────────────────
const SUGGESTED = [
  'What is my total revenue?',
  'Which product sold the most?',
  'Show monthly sales trend.',
  'Who are my top 5 customers?',
  'Which category generates the highest revenue?',
  'What is my total profit and margin?',
  'Which products have the lowest sales?',
  'Predict next month\'s revenue.',
  'What are my biggest business risks?',
  'Which products should I promote?',
];

const fmt = (d) =>
  new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

// ── Main Component ────────────────────────────────────────────────────────────
const AIChat = () => {
  const navigate    = useNavigate();
  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const [input, setInput]         = useState('');
  const [messages, setMessages]   = useState([]);   // { role, content, timestamp }
  const [typing, setTyping]       = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [hasData, setHasData]     = useState(true);

  // Scroll to bottom on every new message
  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, typing]);

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || typing) return;
    setInput('');

    // Add user bubble immediately
    const userMsg = { role: 'user', content: trimmed, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);

    try {
      // Build history (exclude timestamps for API)
      const history = messages.map(m => ({ role: m.role, content: m.content }));

      const res = await sendChatMessage(trimmed, history);
      const data = res.data?.data;

      if (!data?.has_data) {
        setHasData(false);
      }

      const aiMsg = {
        role: 'assistant',
        content: data?.reply || 'I could not generate a response. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to get a response. Please try again.';
      toast.error(errMsg);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setTyping(false);
      inputRef.current?.focus();
    }
  };

  // ── Executive summary ────────────────────────────────────────────────────────
  const handleSummary = async () => {
    setSummaryLoading(true);
    const userMsg = { role: 'user', content: '📊 Generate Business Summary', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);

    try {
      const res = await generateExecutiveSummary();
      const data = res.data?.data;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data?.reply || 'Could not generate summary.',
        timestamp: new Date(),
      }]);
    } catch {
      toast.error('Failed to generate summary.');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Failed to generate the executive summary. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setTyping(false);
      setSummaryLoading(false);
    }
  };

  // ── Clear chat ────────────────────────────────────────────────────────────────
  const clearChat = () => {
    setMessages([]);
    setHasData(true);
    inputRef.current?.focus();
  };

  // ── Handle Enter key ──────────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 128px)', minHeight: 500 }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 style={{ fontWeight: 800, marginBottom: 2 }}>
            <i className="bi bi-chat-dots-fill me-2" style={{ color: '#1a56db' }}></i>
            AI Business Analyst
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
            Ask any question about your uploaded business data
          </p>
        </div>
        <div className="d-flex gap-2">
          {/* Executive Summary button */}
          <button
            className="btn btn-accent px-3 py-2 fw-semibold"
            style={{ borderRadius: 10, fontSize: '0.82rem' }}
            onClick={handleSummary}
            disabled={summaryLoading || typing}
          >
            {summaryLoading
              ? <><span className="spinner-border spinner-border-sm me-2"></span>Generating…</>
              : <><i className="bi bi-file-earmark-text me-2"></i>Business Summary</>}
          </button>
          {/* Clear */}
          {!isEmpty && (
            <button
              className="btn btn-ghost px-3 py-2"
              style={{ borderRadius: 10, fontSize: '0.82rem' }}
              onClick={clearChat}
            >
              <i className="bi bi-trash3 me-2"></i>Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Chat window ──────────────────────────────────────────── */}
      <div
        className="card-panel flex-grow-1 overflow-hidden"
        style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >

        {/* Messages area */}
        <div
          style={{
            flex: 1, overflowY: 'auto', padding: '1.5rem 1.5rem 0.5rem',
            scrollBehavior: 'smooth',
          }}
        >
          {/* Empty / welcome state */}
          {isEmpty && (
            <div style={{ textAlign: 'center', paddingTop: '2rem', paddingBottom: '1rem' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1a56db 0%, #0ea5e9 100%)',
                border: '2px solid #bfdbfe',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem', fontSize: '1.8rem',
                boxShadow: '0 4px 20px rgba(26,86,219,0.25)',
              }}>
                <i className="bi bi-stars" style={{ color: '#fff' }}></i>
              </div>
              <h5 style={{ fontWeight: 800, marginBottom: 6 }}>Ask Me Anything About Your Business</h5>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 420, margin: '0 auto 1.5rem' }}>
                I have access to all your uploaded sales data. Ask about revenue, products,
                customers, trends, forecasts, or get a full business summary.
              </p>

              {/* No data warning */}
              {!hasData && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12,
                  padding: '12px 20px', maxWidth: 420, margin: '0 auto 1.5rem', fontSize: '0.875rem',
                }}>
                  <i className="bi bi-exclamation-triangle-fill me-2" style={{ color: '#dc2626' }}></i>
                  <span style={{ color: '#7f1d1d' }}>
                    No business data found.{' '}
                    <button
                      onClick={() => navigate('/uploads/new')}
                      style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      Upload a CSV file first.
                    </button>
                  </span>
                </div>
              )}

              {/* Suggested questions */}
              <div style={{ maxWidth: 560, margin: '0 auto' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Try asking
                </p>
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  {SUGGESTED.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      disabled={typing}
                      style={{
                        padding: '6px 14px', borderRadius: 999, fontSize: '0.78rem',
                        fontWeight: 600, cursor: 'pointer',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.target.style.background = 'var(--accent)'; e.target.style.color = '#1a1a1a'; }}
                      onMouseLeave={e => { e.target.style.background = 'var(--bg-secondary)'; e.target.style.color = 'var(--text-secondary)'; }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conversation messages */}
          {messages.map((msg, idx) => (
            <ChatMessage
              key={idx}
              role={msg.role}
              content={msg.content}
              timestamp={fmt(msg.timestamp)}
            />
          ))}

          {/* Typing indicator */}
          {typing && <TypingIndicator />}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>

        {/* ── Input bar ──────────────────────────────────────────── */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-card)',
        }}>
          {/* Quick suggestions row (show after first message) */}
          {!isEmpty && (
            <div className="d-flex gap-2 mb-3 flex-wrap">
              {SUGGESTED.slice(0, 4).map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={typing}
                  style={{
                    padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem',
                    fontWeight: 600, cursor: 'pointer',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div className="d-flex gap-3 align-items-end">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                // Auto-grow
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask a business question… (Enter to send, Shift+Enter for new line)"
              disabled={typing}
              style={{
                flex: 1, resize: 'none', overflow: 'hidden',
                background: 'var(--bg-secondary)',
                border: `1px solid ${input ? '#1a56db' : 'var(--border)'}`,
                borderRadius: 14, padding: '12px 16px',
                fontSize: '0.875rem', color: 'var(--text-primary)',
                outline: 'none', lineHeight: 1.5,
                transition: 'border-color 0.2s',
                fontFamily: 'inherit',
                boxShadow: input ? '0 0 0 3px rgba(26,86,219,0.12)' : 'none',
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || typing}
              style={{
                width: 48, height: 48, borderRadius: 14, border: 'none',
                background: input.trim() && !typing ? 'linear-gradient(135deg, #1a56db 0%, #0ea5e9 100%)' : 'var(--bg-secondary)',
                color: input.trim() && !typing ? '#ffffff' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() && !typing ? 'pointer' : 'not-allowed',
                fontSize: '1.1rem', flexShrink: 0,
                transition: 'all 0.2s',
                boxShadow: input.trim() ? '0 2px 8px rgba(26,86,219,0.3)' : 'none',
              }}
            >
              {typing
                ? <span className="spinner-border spinner-border-sm"></span>
                : <i className="bi bi-send-fill"></i>}
            </button>
          </div>

          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 6, marginBottom: 0 }}>
            <i className="bi bi-shield-lock me-1"></i>
            AI answers are based solely on your uploaded business data.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
