import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import CustomerForm from './CustomerForm';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers');
      setCustomers(res.data || []);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async (data: any) => {
    try {
      setSubmitting(true);
      await api.post('/customers', data);
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      console.error('Failed to create customer', err);
      alert('Error creating customer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter customers by search term
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search)) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  // Compute metrics
  const totalCustomers = customers.length;
  const totalOutstanding = customers.reduce((sum, c) => sum + (c.outstanding_balance || 0), 0);
  const creditAccounts = customers.filter(c => (c.outstanding_balance || 0) > 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', textAlign: 'left' }}>
      
      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
      }}>
        {[
          { label: 'Total Customers', value: totalCustomers, icon: '👥', color: 'var(--accent)' },
          { label: 'Outstanding Balance', value: `$${totalOutstanding.toFixed(2)}`, icon: '💰', color: '#ef4444' },
          { label: 'Active Credit Accounts', value: creditAccounts, icon: '💳', color: '#f59e0b' },
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

      {/* Main Table Actions Section */}
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
              placeholder="🔍 Search customers by name, phone or email..."
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
            onClick={() => setIsModalOpen(true)}
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
            👥 Add Customer
          </button>
        </div>

        {/* Customer Listing */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>Loading customer registry...</div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 40px',
            border: '1px dashed var(--border)',
            borderRadius: '8px',
            opacity: 0.8
          }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>👥</span>
            <strong>No customers found</strong>
            <p style={{ fontSize: '13px', marginTop: '4px', opacity: 0.7 }}>
              {search ? 'Try adjusting your search criteria.' : 'Start adding customer accounts to manage outstanding bills and credit bounds.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-h)' }}>Customer Name</th>
                  <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-h)' }}>Phone</th>
                  <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-h)' }}>Email</th>
                  <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-h)' }}>GSTIN</th>
                  <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-h)', textAlign: 'right' }}>Credit Limit</th>
                  <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-h)', textAlign: 'right' }}>Outstanding</th>
                  <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-h)', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((cust) => (
                  <tr
                    key={cust.customer_id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                    }}
                    className="customer-row"
                    onClick={() => navigate(`/app/customers/${cust.customer_id}`)}
                  >
                    <td style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-h)' }}>{cust.name}</td>
                    <td style={{ padding: '16px 12px' }}>{cust.phone || '—'}</td>
                    <td style={{ padding: '16px 12px' }}>{cust.email || '—'}</td>
                    <td style={{ padding: '16px 12px', fontFamily: 'var(--mono)', fontSize: '12px' }}>{cust.gst_number || '—'}</td>
                    <td style={{ padding: '16px 12px', textAlign: 'right' }}>${cust.credit_limit.toFixed(2)}</td>
                    <td style={{
                      padding: '16px 12px',
                      textAlign: 'right',
                      fontWeight: cust.outstanding_balance > 0 ? 600 : 'normal',
                      color: cust.outstanding_balance > 0 ? '#ef4444' : 'inherit'
                    }}>
                      ${cust.outstanding_balance.toFixed(2)}
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <button
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          background: 'var(--code-bg)',
                          color: 'var(--text-h)',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                      >
                        View Profile →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CSS overrides for hover states */}
      <style dangerouslySetInnerHTML={{__html: `
        .customer-row:hover {
          background-color: var(--code-bg) !important;
        }
      `}} />

      {/* Create Customer Dialog Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '32px',
            width: '100%',
            maxWidth: '550px',
            boxShadow: 'var(--shadow)'
          }}>
            <CustomerForm
              onSubmit={handleCreateCustomer}
              onCancel={() => setIsModalOpen(false)}
              isSubmitting={submitting}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default Customers;
