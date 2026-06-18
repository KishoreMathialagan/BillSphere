import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const BalanceSheet: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchReport();
  }, [endDate]);

  const fetchReport = async () => {
    try {
      let url = '/accounting/balance-sheet';
      if (endDate) {
        url += `?end_date=${endDate}`;
      }
      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const renderTable = (title: string, items: any[], total: number) => (
    <div style={{ marginBottom: '30px' }}>
      <h3 style={{ borderBottom: '2px solid var(--border)', paddingBottom: '8px' }}>{title}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '8px' }}>{item.account}</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{item.amount.toFixed(2)}</td>
            </tr>
          ))}
          <tr style={{ fontWeight: 'bold', background: 'var(--code-bg)' }}>
            <td style={{ padding: '8px' }}>Total {title}</td>
            <td style={{ padding: '8px', textAlign: 'right' }}>{total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Balance Sheet</h1>
      <p style={{ opacity: 0.7 }}>A snapshot of Assets, Liabilities, and Equity.</p>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', padding: '20px', background: 'var(--surface)', borderRadius: '8px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>As of Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', color: 'inherit' }} />
        </div>
      </div>

      {data ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h2 style={{ color: '#10b981' }}>Assets</h2>
            {renderTable('Assets', data.assets, data.total_assets)}
          </div>
          
          <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h2 style={{ color: '#ef4444' }}>Liabilities & Equity</h2>
            {renderTable('Liabilities', data.liabilities, data.total_liabilities)}
            {renderTable('Equity', data.equity, data.total_equity)}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--code-bg)', border: '2px solid var(--border)', borderRadius: '8px', marginTop: '20px' }}>
              <h3 style={{ margin: 0 }}>Total Liab & Equity</h3>
              <h3 style={{ margin: 0 }}>{(data.total_liabilities + data.total_equity).toFixed(2)}</h3>
            </div>
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default BalanceSheet;
