import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import CustomerForm from './CustomerForm';

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // New Invoice form state
  const [invNumber, setInvNumber] = useState('');
  const [invTotal, setInvTotal] = useState(0);
  const [invOutstanding, setInvOutstanding] = useState(0);
  const [invStatus, setInvStatus] = useState('Unpaid');
  const [invoiceError, setInvoiceError] = useState('');

  // Payment form state
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('Cash');
  const [paymentError, setPaymentError] = useState('');

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      setError('');
      const [custRes, invRes] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get(`/customers/${id}/invoices`)
      ]);
      setCustomer(custRes.data);
      setInvoices(invRes.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to load customer profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  // Edit Customer
  const handleEditCustomer = async (data: any) => {
    try {
      setModalSubmitting(true);
      const res = await api.put(`/customers/${id}`, data);
      setCustomer(res.data);
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to update customer');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async () => {
    if (!window.confirm('Are you sure you want to delete this customer account?')) return;
    try {
      await api.delete(`/customers/${id}`);
      navigate('/app/customers');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to delete customer');
    }
  };

  // Record Sale / Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invNumber.trim() || invTotal <= 0) {
      setInvoiceError('Please fill in valid transaction details.');
      return;
    }
    try {
      setModalSubmitting(true);
      setInvoiceError('');
      await api.post(`/customers/${id}/invoices`, {
        invoice_number: invNumber,
        total_amount: Number(invTotal),
        outstanding_amount: Number(invOutstanding),
        status: invStatus,
      });
      setIsInvoiceModalOpen(false);
      // Reset form
      setInvNumber('');
      setInvTotal(0);
      setInvOutstanding(0);
      setInvStatus('Unpaid');
      fetchCustomerData();
    } catch (err: any) {
      console.error(err);
      setInvoiceError(err.response?.data?.detail || 'Failed to record transaction.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Record Payment
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) {
      setPaymentError('Payment amount must be greater than zero.');
      return;
    }
    try {
      setModalSubmitting(true);
      setPaymentError('');
      await api.post(`/customers/${id}/payments`, {
        amount: Number(payAmount),
        payment_method: payMethod,
      });
      setIsPaymentModalOpen(false);
      setPayAmount(0);
      fetchCustomerData();
    } catch (err: any) {
      console.error(err);
      setPaymentError(err.response?.data?.detail || 'Failed to record payment.');
    } finally {
      setModalSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Loading customer profile...</div>;
  if (error || !customer) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
        <h3>Error</h3>
        <p>{error || 'Customer not found.'}</p>
        <Link to="/app/customers">Back to Customers</Link>
      </div>
    );
  }

  // Derived metrics
  const availableCredit = customer.credit_limit - customer.outstanding_balance;
  const totalPurchases = invoices
    .filter(inv => inv.total_amount > 0)
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', textAlign: 'left' }}>
      
      {/* Breadcrumb & Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/app/customers" style={{ textDecoration: 'none', color: 'var(--accent)', fontWeight: 500 }}>
          ← Back to Customers
        </Link>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setIsEditModalOpen(true)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--code-bg)',
              color: 'var(--text-h)',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            ✏️ Edit Profile
          </button>
          <button
            onClick={handleDeleteCustomer}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              background: 'rgba(254, 226, 226, 0.4)',
              color: '#ef4444',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            🗑️ Delete Customer
          </button>
        </div>
      </div>

      {/* Profile Header Card */}
      <div style={{
        background: 'var(--code-bg)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>👤</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-h)' }}>
                {customer.name}
              </h2>
              <span style={{ fontSize: '12px', opacity: 0.6 }}>ID: {customer.customer_id}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '24px', marginTop: '24px', flexWrap: 'wrap' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', opacity: 0.6 }}>Phone</strong>
              <span style={{ color: 'var(--text-h)', fontWeight: 500 }}>{customer.phone || 'N/A'}</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', opacity: 0.6 }}>Email</strong>
              <span style={{ color: 'var(--text-h)', fontWeight: 500 }}>{customer.email || 'N/A'}</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', opacity: 0.6 }}>GSTIN</strong>
              <span style={{ color: 'var(--text-h)', fontFamily: 'var(--mono)', fontWeight: 500 }}>{customer.gst_number || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => {
              setInvNumber(`INV-${Date.now().toString().slice(-6)}`);
              setIsInvoiceModalOpen(true);
            }}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              textAlign: 'center',
              boxShadow: '0 4px 12px var(--accent-bg)'
            }}
          >
            ➕ Record Credit Invoice
          </button>
          
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text-h)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              textAlign: 'center'
            }}
          >
            💰 Record Debt Payment
          </button>
        </div>
      </div>

      {/* Credit widgets */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
      }}>
        {[
          { label: 'Credit Limit', value: `$${customer.credit_limit.toFixed(2)}`, color: 'var(--accent)' },
          { label: 'Outstanding Balance', value: `$${customer.outstanding_balance.toFixed(2)}`, color: customer.outstanding_balance > 0 ? '#ef4444' : 'inherit' },
          { label: 'Available Credit', value: `$${availableCredit.toFixed(2)}`, color: availableCredit < 200 ? '#f59e0b' : '#10b981' },
          { label: 'Total Purchases', value: `$${totalPurchases.toFixed(2)}`, color: '#3b82f6' },
        ].map((stat, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--bg)',
              borderRadius: '12px',
              padding: '20px 24px',
              border: '1px solid var(--border)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {stat.label}
            </span>
            <h3 style={{
              margin: '6px 0 0',
              fontSize: '24px',
              fontWeight: 700,
              color: stat.color
            }}>
              {stat.value}
            </h3>
          </div>
        ))}
      </div>

      {/* Transactions */}
      <div style={{
        background: 'var(--bg)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-h)' }}>
          📜 Ledger & Purchase History
        </h3>

        {invoices.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            border: '1px dashed var(--border)',
            borderRadius: '8px',
            color: 'var(--text)',
            opacity: 0.7
          }}>
            No transaction records found for this account. Click "Record Credit Invoice" to add a purchase transaction.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>Invoice Number</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>Type</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'right' }}>Total Amount</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'right' }}>Credit Outstanding</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((item) => {
                  const isPayment = item.total_amount < 0;
                  return (
                    <tr key={item.invoice_id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 8px', fontFamily: 'var(--mono)', fontWeight: 500, color: 'var(--text-h)' }}>
                        {item.invoice_number}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          color: isPayment ? '#10b981' : 'var(--accent)',
                          background: isPayment ? 'rgba(16, 185, 129, 0.1)' : 'var(--accent-bg)'
                        }}>
                          {isPayment ? '💸 Payment' : '🛍️ Purchase'}
                        </span>
                      </td>
                      <td style={{
                        padding: '12px 8px',
                        textAlign: 'right',
                        fontWeight: 600,
                        color: isPayment ? '#10b981' : 'var(--text-h)'
                      }}>
                        {isPayment ? `-$${Math.abs(item.total_amount).toFixed(2)}` : `$${item.total_amount.toFixed(2)}`}
                      </td>
                      <td style={{
                        padding: '12px 8px',
                        textAlign: 'right',
                        color: item.outstanding_amount > 0 ? '#ef4444' : 'inherit'
                      }}>
                        {item.outstanding_amount !== 0 ? `$${item.outstanding_amount.toFixed(2)}` : '—'}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          color: item.status === 'Paid' ? '#10b981' : item.status === 'Partially Paid' ? '#f59e0b' : '#ef4444',
                          background: item.status === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : item.status === 'Partially Paid' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                        }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        {!isPayment && (
                          <button
                            onClick={() => {
                              alert(`Generate E-Way Bill for ${item.invoice_number}`);
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              background: 'var(--bg)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-h)',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: 600
                            }}
                          >
                            Generate E-Way Bill
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Customer Dialog Modal */}
      {isEditModalOpen && (
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
              initialData={customer}
              onSubmit={handleEditCustomer}
              onCancel={() => setIsEditModalOpen(false)}
              isSubmitting={modalSubmitting}
            />
          </div>
        </div>
      )}

      {/* Record Invoice Dialog Modal */}
      {isInvoiceModalOpen && (
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
            maxWidth: '450px',
            boxShadow: 'var(--shadow)'
          }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: 600 }}>🛍️ Record Credit Invoice</h3>
            
            {invoiceError && (
              <p style={{
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '10px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                marginTop: 0
              }}>{invoiceError}</p>
            )}

            <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', opacity: 0.8 }}>
                  Invoice Number
                </label>
                <input
                  type="text"
                  required
                  value={invNumber}
                  onChange={(e) => setInvNumber(e.target.value)}
                  placeholder="e.g. INV-100234"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--code-bg)',
                    color: 'var(--text-h)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', opacity: 0.8 }}>
                    Total Amount ($)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    value={invTotal}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setInvTotal(val);
                      if (invStatus === 'Unpaid') {
                        setInvOutstanding(val);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--code-bg)',
                      color: 'var(--text-h)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', opacity: 0.8 }}>
                    Credit Outstanding ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={invTotal}
                    step="any"
                    required
                    value={invOutstanding}
                    onChange={(e) => setInvOutstanding(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--code-bg)',
                      color: 'var(--text-h)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', opacity: 0.8 }}>
                  Status
                </label>
                <select
                  value={invStatus}
                  onChange={(e) => {
                    const status = e.target.value;
                    setInvStatus(status);
                    if (status === 'Paid') {
                      setInvOutstanding(0);
                    } else if (status === 'Unpaid') {
                      setInvOutstanding(invTotal);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--code-bg)',
                    color: 'var(--text-h)',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Paid">Fully Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                borderTop: '1px solid var(--border)',
                paddingTop: '20px',
                marginTop: '10px'
              }}>
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-h)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--accent)',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 600,
                    opacity: modalSubmitting ? 0.7 : 1,
                  }}
                >
                  {modalSubmitting ? 'Recording...' : 'Record Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Dialog Modal */}
      {isPaymentModalOpen && (
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
            maxWidth: '400px',
            boxShadow: 'var(--shadow)'
          }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: 600 }}>💰 Record Debt Payment</h3>

            {paymentError && (
              <p style={{
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '10px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                marginTop: 0
              }}>{paymentError}</p>
            )}

            <form onSubmit={handleCreatePayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', opacity: 0.8 }}>
                  Payment Amount ($)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--code-bg)',
                    color: 'var(--text-h)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', opacity: 0.8 }}>
                  Payment Method
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--code-bg)',
                    color: 'var(--text-h)',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card / NetBanking</option>
                </select>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                borderTop: '1px solid var(--border)',
                paddingTop: '20px',
                marginTop: '10px'
              }}>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-h)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--accent)',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 600,
                    opacity: modalSubmitting ? 0.7 : 1,
                  }}
                >
                  {modalSubmitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerDetail;
