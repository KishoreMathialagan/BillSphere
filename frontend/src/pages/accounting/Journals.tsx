import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Journals: React.FC = () => {
  const [journals, setJournals] = useState<any[]>([]);

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      const res = await api.get('/accounting/journals');
      setJournals(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Journal Entries</h1>
      <p style={{ opacity: 0.7 }}>View all auto-generated and manual journal entries.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
        {journals.map((j, i) => (
          <div key={i} style={{ padding: '16px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <strong>{new Date(j.entry_date).toLocaleString()}</strong>
                <span style={{ marginLeft: '12px', opacity: 0.6 }}>Ref: {j.reference}</span>
              </div>
              <div style={{ opacity: 0.8 }}>
                {j.source_entity}
              </div>
            </div>
            <p style={{ margin: '0 0 12px 0', opacity: 0.8 }}>{j.description}</p>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Account ID</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Debit (Dr)</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Credit (Cr)</th>
                </tr>
              </thead>
              <tbody>
                {j.lines.map((l: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px' }}>{l.account_id}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: l.debit > 0 ? '#10b981' : 'inherit' }}>
                      {l.debit > 0 ? l.debit.toFixed(2) : '-'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', color: l.credit > 0 ? '#ef4444' : 'inherit' }}>
                      {l.credit > 0 ? l.credit.toFixed(2) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {journals.length === 0 && (
          <div style={{ textAlign: 'center', opacity: 0.5, padding: '40px' }}>No journal entries found.</div>
        )}
      </div>
    </div>
  );
};

export default Journals;
