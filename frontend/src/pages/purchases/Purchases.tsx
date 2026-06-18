import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const Purchases: React.FC = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      // Calls the new global purchases endpoint
      const res = await api.get('/vendors/all/history');
      setPurchases(res.data || []);
    } catch (err) {
      console.error('Failed to load purchases', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const filteredPurchases = purchases.filter(p =>
    p.purchase_number.toLowerCase().includes(search.toLowerCase()) ||
    (p.status && p.status.toLowerCase().includes(search.toLowerCase()))
  );

  const totalSpent = purchases.filter(p => p.total_amount > 0).reduce((sum, p) => sum + p.total_amount, 0);
  const totalOutstanding = purchases.reduce((sum, p) => sum + p.outstanding_amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', textAlign: 'left' }}>
      
      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
      }}>
        {[
          { label: 'Total Purchases', value: purchases.filter(p => p.total_amount > 0).length, icon: '🛒', color: 'var(--accent)' },
          { label: 'Total Spend', value: `$${totalSpent.toFixed(2)}`, icon: '💵', color: '#10b981' },
          { label: 'Total Outstanding', value: `$${totalOutstanding.toFixed(2)}`, icon: '💰', color: '#ef4444' },
        ].map((stat, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--code-bg)',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}
          >
            <div>
              <span style={{ fontSize: '13px', fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {stat.label}
              </span>
              <h3 style={{
                margin: '8px 0 0',
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--text-h)'
              }}>
                {loading ? '...' : stat.value}
              </h3>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Section */}
      <div style={{
        background: 'var(--bg)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          {/* Search bar */}
          <div style={{ position: 'relative', flexGrow: 1, maxWidth: '400px' }}>
            <input
              type="text"
              placeholder="🔍 Search by Purchase Number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--code-bg)',
                color: 'var(--text-h)',
                boxSizing: 'border-box',
                fontSize: '14px'
              }}
            />
          </div>

          <button
            onClick={() => navigate('/app/purchases/new')}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px var(--accent-bg)',
              transition: 'transform 0.2s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
          >
            ➕ New Purchase Entry
          </button>
        </div>

        {/* Listing */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>Loading purchase history...</div>
        ) : filteredPurchases.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 40px',
            border: '1px dashed var(--border)',
            borderRadius: '8px',
            opacity: 0.8
          }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🛒</span>
            <strong>No purchases found</strong>
            <p style={{ fontSize: '13px', marginTop: '4px', opacity: 0.7 }}>
              {search ? 'Try adjusting your search criteria.' : 'Create a new purchase entry to restock inventory.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-h)' }}>Date</th>
                  <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-h)' }}>Purchase No.</th>
                  <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-h)' }}>Status</th>
                  <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-h)', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-h)', textAlign: 'right' }}>Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((p) => {
                  const isPayment = p.total_amount < 0;
                  return (
                    <tr key={p.purchase_id} style={{ borderBottom: '1px solid var(--code-bg)' }}>
                      <td style={{ padding: '16px 12px', color: 'var(--text-h)' }}>
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 12px', fontFamily: 'monospace' }}>{p.purchase_number}</td>
                      <td style={{ padding: '16px 12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          background: isPayment ? 'rgba(16, 185, 129, 0.1)' : p.status === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : p.status === 'Partial' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: isPayment ? '#10b981' : p.status === 'Paid' ? '#10b981' : p.status === 'Partial' ? '#f59e0b' : '#ef4444'
                        }}>
                          {isPayment ? 'Payment' : p.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 500, color: isPayment ? '#10b981' : 'inherit' }}>
                        {isPayment ? `-$${Math.abs(p.total_amount).toFixed(2)}` : `$${p.total_amount.toFixed(2)}`}
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 500 }}>
                        {isPayment ? '-' : `$${p.outstanding_amount.toFixed(2)}`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Purchases;
