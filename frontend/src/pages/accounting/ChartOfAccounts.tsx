import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ChartOfAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounting/accounts');
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getBadgeColor = (type: string) => {
    switch(type) {
      case 'Asset': return '#10b981';
      case 'Liability': return '#ef4444';
      case 'Equity': return '#8b5cf6';
      case 'Revenue': return '#3b82f6';
      case 'Expense': return '#f59e0b';
      default: return 'gray';
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Chart of Accounts</h1>
      <p style={{ opacity: 0.7 }}>Manage your double-entry ledger accounts.</p>

      <div style={{ overflowX: 'auto', marginTop: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--code-bg)', borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '12px' }}>Code</th>
              <th style={{ padding: '12px' }}>Account Name</th>
              <th style={{ padding: '12px' }}>Type</th>
              <th style={{ padding: '12px' }}>System Account</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{a.account_code}</td>
                <td style={{ padding: '12px' }}>{a.account_name}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: `${getBadgeColor(a.account_type)}22`, color: getBadgeColor(a.account_type), border: `1px solid ${getBadgeColor(a.account_type)}` }}>
                    {a.account_type}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  {a.is_system_account ? <span style={{ color: '#10b981' }}>Yes ({a.system_tag})</span> : <span style={{ color: 'var(--text-h)' }}>No</span>}
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>No accounts found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChartOfAccounts;
