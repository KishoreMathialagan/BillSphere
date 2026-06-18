import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ProfitAndLoss: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const fetchReport = async () => {
    try {
      let url = '/accounting/profit-and-loss';
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (params.toString()) url += `?${params.toString()}`;
      
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
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Profit & Loss</h1>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', padding: '20px', background: 'var(--surface)', borderRadius: '8px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', color: 'inherit' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', color: 'inherit' }} />
        </div>
      </div>

      {data ? (
        <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          {renderTable('Revenue', data.revenue, data.total_revenue)}
          {renderTable('Expenses', data.expenses, data.total_expense)}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: data.net_profit >= 0 ? '#10b98122' : '#ef444422', border: `2px solid ${data.net_profit >= 0 ? '#10b981' : '#ef4444'}`, borderRadius: '8px', marginTop: '40px' }}>
            <h2 style={{ margin: 0, color: data.net_profit >= 0 ? '#10b981' : '#ef4444' }}>Net Profit</h2>
            <h2 style={{ margin: 0, color: data.net_profit >= 0 ? '#10b981' : '#ef4444' }}>{data.net_profit.toFixed(2)}</h2>
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default ProfitAndLoss;
