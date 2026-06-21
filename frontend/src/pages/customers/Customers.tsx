import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import CustomerForm from './CustomerForm';
import { NeuoCard } from '../../components/molecules/NeuoCard';
import { Button } from '../../components/atoms/Button';
import { Input } from '../../components/atoms/Input';
import { Badge } from '../../components/atoms/Badge';

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

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search)) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const totalCustomers = customers.length;
  const totalOutstanding = customers.reduce((sum, c) => sum + (c.outstanding_balance || 0), 0);
  const creditAccounts = customers.filter(c => (c.outstanding_balance || 0) > 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="heading-2">Customers</h2>
          <p className="body" style={{ color: 'var(--color-night-60)' }}>Manage customer accounts, outstanding balances, and credit limits.</p>
        </div>
        <Button variant="filled" onClick={() => setIsModalOpen(true)}>
          👥 Add Customer
        </Button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)' }}>
        <NeuoCard>
          <div className="data-label" style={{ color: 'var(--color-night-60)', marginBottom: 'var(--space-2)' }}>Total Customers</div>
          <div className="metric-lg" style={{ color: 'var(--color-cyprus)' }}>
            {loading ? '--' : totalCustomers}
          </div>
        </NeuoCard>
        
        <NeuoCard>
          <div className="data-label" style={{ color: 'var(--color-night-60)', marginBottom: 'var(--space-2)' }}>Outstanding Balance</div>
          <div className="metric-lg" style={{ color: 'var(--color-danger)' }}>
            {loading ? '--' : `₹${totalOutstanding.toFixed(2)}`}
          </div>
        </NeuoCard>
        
        <NeuoCard>
          <div className="data-label" style={{ color: 'var(--color-night-60)', marginBottom: 'var(--space-2)' }}>Active Credit Accounts</div>
          <div className="metric-lg" style={{ color: 'var(--color-warning)' }}>
            {loading ? '--' : creditAccounts}
          </div>
        </NeuoCard>
      </div>

      {/* Main Table Actions Section */}
      <NeuoCard style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-sand-dark)' }}>
          <Input
            placeholder="Search customers by name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<span>🔍</span>}
            style={{ maxWidth: '400px' }}
          />
        </div>

        {/* Customer Listing */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', opacity: 0.6 }} className="body">Loading customer registry...</div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-10)', opacity: 0.5 }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>👥</div>
            <p className="body">No customers found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'var(--color-cyprus-glass)', borderBottom: '1px solid var(--color-sand-dark)' }}>
                <tr>
                  <th className="data-label" style={{ padding: 'var(--space-4)', color: 'var(--color-cyprus)' }}>Customer Name</th>
                  <th className="data-label" style={{ padding: 'var(--space-4)', color: 'var(--color-cyprus)' }}>Contact</th>
                  <th className="data-label" style={{ padding: 'var(--space-4)', color: 'var(--color-cyprus)' }}>GSTIN</th>
                  <th className="data-label" style={{ padding: 'var(--space-4)', color: 'var(--color-cyprus)', textAlign: 'right' }}>Credit Limit</th>
                  <th className="data-label" style={{ padding: 'var(--space-4)', color: 'var(--color-cyprus)', textAlign: 'right' }}>Outstanding</th>
                  <th className="data-label" style={{ padding: 'var(--space-4)', color: 'var(--color-cyprus)', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((cust) => (
                  <tr
                    key={cust.customer_id}
                    style={{ borderBottom: '1px solid var(--color-sand-dark)', cursor: 'pointer', transition: 'background-color 0.2s ease' }}
                    onClick={() => navigate(`/app/customers/${cust.customer_id}`)}
                    className="hover-row"
                  >
                    <td style={{ padding: 'var(--space-4)' }}>
                      <div className="body" style={{ fontWeight: 600 }}>{cust.name}</div>
                    </td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <div className="body-sm">{cust.phone || '—'}</div>
                      <div className="body-sm" style={{ opacity: 0.7 }}>{cust.email || '—'}</div>
                    </td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <span className="body-sm" style={{ fontFamily: 'var(--font-mono)' }}>{cust.gst_number || '—'}</span>
                    </td>
                    <td style={{ padding: 'var(--space-4)', textAlign: 'right' }} className="body">
                      ₹{cust.credit_limit.toFixed(2)}
                    </td>
                    <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                      {cust.outstanding_balance > 0 ? (
                        <Badge variant="danger">₹{cust.outstanding_balance.toFixed(2)}</Badge>
                      ) : (
                        <span className="body" style={{ color: 'var(--color-night-40)' }}>₹0.00</span>
                      )}
                    </td>
                    <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/app/customers/${cust.customer_id}`); }}>
                        View Profile →
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </NeuoCard>

      <style>{`
        .hover-row:hover {
          background-color: var(--color-cyprus-tint);
        }
      `}</style>

      {/* Create Customer Dialog Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <NeuoCard style={{ width: '100%', maxWidth: '550px', padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <h3 className="heading-3" style={{ margin: 0 }}>Add New Customer</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>✕</Button>
            </div>
            <CustomerForm
              onSubmit={handleCreateCustomer}
              onCancel={() => setIsModalOpen(false)}
              isSubmitting={submitting}
            />
          </NeuoCard>
        </div>
      )}

    </div>
  );
};

export default Customers;
