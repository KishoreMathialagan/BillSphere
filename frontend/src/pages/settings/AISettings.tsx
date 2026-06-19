import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AISettings: React.FC = () => {
  const [aiModel, setAiModel] = useState('qwen/qwen-2.5-7b-instruct');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/setup/config');
      if (res.data.ai_model) {
        setAiModel(res.data.ai_model);
      }
    } catch (err) {
      console.error('Failed to load AI config', err);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    setMessage('');
    try {
      await api.put('/setup/config', { ai_model: aiModel });
      setMessage('Settings saved successfully!');
    } catch (err) {
      setMessage('Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  const models = [
    { id: 'qwen/qwen-2.5-7b-instruct', name: 'Qwen 2.5 7B (Primary Default)', cost: 'Low Cost' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat (Reasoning Fallback)', cost: 'Low Cost' },
    { id: 'google/gemini-pro', name: 'Google Gemini Pro', cost: 'Premium' },
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', cost: 'Premium' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', cost: 'Premium' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      <div>
        <h2 style={{ margin: 0, color: 'var(--text-h)' }}>AI Configuration</h2>
        <p style={{ opacity: 0.7, margin: '8px 0 0' }}>Configure the OpenRouter AI models powering your Business Advisor.</p>
      </div>

      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px', color: 'var(--text-h)' }}>AI Model Selection</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {models.map(model => (
            <label 
              key={model.id} 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', 
                border: aiModel === model.id ? '2px solid var(--accent)' : '1px solid var(--border)', 
                borderRadius: '8px', cursor: 'pointer', background: aiModel === model.id ? 'var(--code-bg)' : 'transparent'
              }}
            >
              <input 
                type="radio" 
                name="aiModel" 
                value={model.id} 
                checked={aiModel === model.id} 
                onChange={(e) => setAiModel(e.target.value)} 
                style={{ cursor: 'pointer' }}
              />
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: '15px' }}>{model.name}</div>
                <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>ID: {model.id}</div>
              </div>
              <div style={{ 
                padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                background: model.cost === 'Low Cost' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(234, 67, 53, 0.1)',
                color: model.cost === 'Low Cost' ? '#10b981' : '#ea4335'
              }}>
                {model.cost}
              </div>
            </label>
          ))}
        </div>

        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={saveConfig}
            disabled={loading}
            style={{ 
              padding: '10px 24px', background: 'var(--accent)', color: 'white', 
              border: 'none', borderRadius: '8px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' 
            }}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
          {message && (
            <span style={{ color: message.includes('success') ? '#10b981' : '#ef4444', fontSize: '14px', fontWeight: 500 }}>
              {message}
            </span>
          )}
        </div>
      </div>
      
      <div style={{ background: '#fef2f2', border: '1px solid #f87171', borderRadius: '12px', padding: '20px', color: '#b91c1c' }}>
        <h4 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>⚠️</span> Security Notice
        </h4>
        <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>
          The AI model receives sanitized financial context (e.g. Total Sales, Lowest Stock Items) via prompt injection. It does <strong>not</strong> have direct SQL access to your database or write access to financial records.
        </p>
      </div>

    </div>
  );
};

export default AISettings;
