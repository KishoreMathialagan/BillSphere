import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const BranchReports: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports/branches');
      setReports(res.data.reports || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading Branch Metrics...</div>;

  const totalSalesAll = reports.reduce((acc, curr) => acc + curr.total_sales, 0);
  const totalInvAll = reports.reduce((acc, curr) => acc + curr.inventory_value, 0);
  const totalExcAll = reports.reduce((acc, curr) => acc + curr.exception_count, 0);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Branch Performance Reports</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px 0', opacity: 0.7 }}>Total Network Sales</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#10b981' }}>${totalSalesAll.toFixed(2)}</p>
        </div>
        <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px 0', opacity: 0.7 }}>Total Network Inventory</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: 'var(--accent)' }}>${totalInvAll.toFixed(2)}</p>
        </div>
        <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px 0', opacity: 0.7 }}>Total Stock Exceptions</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: totalExcAll > 0 ? '#ea4335' : 'var(--text-h)' }}>{totalExcAll}</p>
        </div>
      </div>

      <h2>Branch Breakdown</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--code-bg)', borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '12px' }}>Branch Name</th>
              <th style={{ padding: '12px' }}>Total Sales</th>
              <th style={{ padding: '12px' }}>Inventory Value</th>
              <th style={{ padding: '12px' }}>Stock Exceptions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px', fontWeight: 600 }}>{r.branch_name}</td>
                <td style={{ padding: '12px', color: '#10b981' }}>${r.total_sales.toFixed(2)}</td>
                <td style={{ padding: '12px' }}>${r.inventory_value.toFixed(2)}</td>
                <td style={{ padding: '12px', color: r.exception_count > 0 ? '#ea4335' : 'inherit' }}>
                  {r.exception_count} {r.exception_count > 0 && '⚠️'}
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>No branches configured yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BranchReports;
