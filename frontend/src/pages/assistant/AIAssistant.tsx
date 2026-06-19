import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am your AI Business Assistant. I can analyze your sales, review inventory levels, and suggest ways to improve your profits. What would you like to know?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/assistant/chat', { query: userMessage.content });
      const assistantMessage: Message = { id: Date.now().toString(), role: 'assistant', content: response.data.response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: Message = { id: Date.now().toString(), role: 'assistant', content: `**Error:** ${err.message}` };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: 'var(--bg)', margin: '-10px', padding: '0' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--code-bg)' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', color: 'white', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
        }}>
          ✨
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-h)' }}>AI Business Advisor</h2>
          <span style={{ fontSize: '13px', opacity: 0.7 }}>Powered by OpenRouter</span>
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '75%',
              padding: '16px 20px',
              borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
              background: msg.role === 'user' ? 'var(--accent)' : 'var(--code-bg)',
              color: msg.role === 'user' ? 'white' : 'var(--text)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
              lineHeight: 1.5,
              fontSize: '15px'
            }}>
              {msg.role === 'assistant' ? (
                <div className="markdown-body" style={{ color: 'inherit' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '16px 20px', borderRadius: '20px 20px 20px 4px',
              background: 'var(--code-bg)', border: '1px solid var(--border)',
              display: 'flex', gap: '6px'
            }}>
              <span className="dot-typing" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1.5s infinite' }}></span>
              <span className="dot-typing" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1.5s infinite 0.2s' }}></span>
              <span className="dot-typing" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1.5s infinite 0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', gap: '12px', background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about inventory, sales trends, or profit optimization..."
            style={{
              flex: 1, border: 'none', background: 'transparent', color: 'var(--text-h)',
              padding: '12px', fontSize: '15px', resize: 'none', height: '24px', outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{
              padding: '0 24px', borderRadius: '8px', background: 'var(--accent)', color: 'white',
              border: 'none', fontWeight: 600, cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
              opacity: (loading || !input.trim()) ? 0.5 : 1
            }}
          >
            Send
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', opacity: 0.5 }}>
          AI suggestions are based on your recent 30-day ledger and current inventory levels.
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
