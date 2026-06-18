import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import VendorForm from './VendorForm';

const VendorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // New Purchase form state
  const [purchNumber, setPurchNumber] = useState('');
  const [purchTotal, setPurchTotal] = useState(0);
  const [purchOutstanding, setPurchOutstanding] = useState(0);
  const [purchStatus, setPurchStatus] = useState('Unpaid');
  const [purchaseError, setPurchaseError] = useState('');

  // Payment form state
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('Cash');
  const [paymentError, setPaymentError] = useState('');

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      setError('');
      const [vendRes, purchRes] = await Promise.all([
        api.get(`/vendors/${id}`),
        api.get(`/vendors/${id}/purchases`)
      ]);
      setVendor(vendRes.data);
      setPurchases(purchRes.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to load vendor profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorData();
  }, [id]);

  // Edit Vendor
  const handleEditVendor = async (data: any) => {
    try {
      setModalSubmitting(true);
      const res = await api.put(`/vendors/${id}`, data);
      setVendor(res.data);
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to update vendor');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Delete Vendor
  const handleDeleteVendor = async () => {
    if (!window.confirm('Are you sure you want to delete this vendor account?')) return;
    try {
      await api.delete(`/vendors/${id}`);
      navigate('/app/vendors');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to delete vendor');
    }
  };

  // Record Purchase
  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchNumber.trim() || purchTotal <= 0) {
      setPurchaseError('Please fill in valid purchase details.');
      return;
    }
    try {
      setModalSubmitting(true);
      setPurchaseError('');
      await api.post(`/vendors/${id}/purchases`, {
        purchase_number: purchNumber,
        total_amount: Number(purchTotal),
        outstanding_amount: Number(purchOutstanding),
        status: purchStatus,
      });
      setIsPurchaseModalOpen(false);
      // Reset form
      setPurchNumber('');
      setPurchTotal(0);
      setPurchOutstanding(0);
      setPurchStatus('Unpaid');
      fetchVendorData();
    } catch (err: any) {
      console.error(err);
      setPurchaseError(err.response?.data?.detail || 'Failed to record purchase.');
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
      await api.post(`/vendors/${id}/payments`, {
        amount: Number(payAmount),
        payment_method: payMethod,
      });
      setIsPaymentModalOpen(false);
      setPayAmount(0);
      fetchVendorData();
    } catch (err: any) {
      console.error(err);
      setPaymentError(err.response?.data?.detail || 'Failed to record payment.');
    } finally {
      setModalSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Loading vendor profile...</div>;
  if (error || !vendor) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
        <h3>Error</h3>
        <p>{error || 'Vendor not found.'}</p>
        <Link to="/app/vendors">Back to Vendors</Link>
      </div>
    );
  }

  // Derived metrics
  const totalPurchases = purchases
    .filter(p => p.total_amount > 0)
    .reduce((sum, p) => sum + p.total_amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', textAlign: 'left' }}>
      
      {/* Breadcrumb & Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/app/vendors" style={{ textDecoration: 'none', color: 'var(--accent)', fontWeight: 500 }}>
          ← Back to Vendors
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
            onClick={handleDeleteVendor}
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
            🗑️ Delete Vendor
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
        flexWrap: 'wrap',
        gap: '40px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'var(--accent-bg)',
            color: 'var(--accent)',
            fontSize: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {vendor.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: '0 0 8px', fontSize: '28px', color: 'var(--text-h)', fontWeight: 700 }}>
              {vendor.name}
            </h2>
            <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--text)', opacity: 0.8 }}>
              {vendor.phone && <span>📞 {vendor.phone}</span>}
              {vendor.email && <span>✉️ {vendor.email}</span>}
              {vendor.gst_number && <span>🧾 GST: {vendor.gst_number}</span>}
            </div>
          </div>
        </div>

        {/* Financial Snapshot */}
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.7, marginBottom: '4px' }}>
              Lifetime Purchases
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-h)' }}>
              ${totalPurchases.toFixed(2)}
            </div>
          </div>
          <div style={{ width: '1px', background: 'var(--border)' }}></div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.7, marginBottom: '4px' }}>
              Outstanding Payable
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: vendor.outstanding_balance > 0 ? '#ef4444' : 'var(--text-h)' }}>
              ${vendor.outstanding_balance.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons for Transactions */}
      <div style={{ display: 'flex', gap: '16px' }}>
        <button
          onClick={() => setIsPurchaseModalOpen(true)}
          style={{
            padding: '14px 24px',
            borderRadius: '12px',
            border: 'none',
            background: 'var(--accent)',
            color: 'white',
            fontWeight: 600,
            fontSize: '15px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px var(--accent-bg)'
          }}
        >
          ➕ Record New Purchase
        </button>
        <button
          onClick={() => setIsPaymentModalOpen(true)}
          disabled={vendor.outstanding_balance <= 0}
          style={{
            padding: '14px 24px',
            borderRadius: '12px',
            border: '1px solid #10b981',
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#10b981',
            fontWeight: 600,
            fontSize: '15px',
            cursor: vendor.outstanding_balance <= 0 ? 'not-allowed' : 'pointer',
            opacity: vendor.outstanding_balance <= 0 ? 0.5 : 1
          }}
        >
          💸 Record Payment
        </button>
      </div>

      {/* Purchase History Table */}
      <div style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px',
        marginTop: '8px'
      }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600, color: 'var(--text-h)' }}>
          Purchase History
        </h3>
        {purchases.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6, fontSize: '14px' }}>
            No purchases recorded for this vendor yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Purchase No.</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Total Amount</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(purch => {
                  const isPayment = purch.total_amount < 0;
                  return (
                    <tr key={purch.purchase_id} style={{ borderBottom: '1px solid var(--code-bg)' }}>
                      <td style={{ padding: '12px' }}>
                        {new Date(purch.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'monospace' }}>
                        {purch.purchase_number}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          background: isPayment ? 'rgba(16, 185, 129, 0.1)' : purch.status === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : purch.status === 'Partial' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: isPayment ? '#10b981' : purch.status === 'Paid' ? '#10b981' : purch.status === 'Partial' ? '#f59e0b' : '#ef4444'
                        }}>
                          {isPayment ? 'Payment' : purch.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: isPayment ? '#10b981' : 'inherit' }}>
                        {isPayment ? `-$${Math.abs(purch.total_amount).toFixed(2)}` : `$${purch.total_amount.toFixed(2)}`}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {isPayment ? '-' : `$${purch.outstanding_amount.toFixed(2)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px'
          }}>
            <VendorForm 
              initialData={vendor}
              onSubmit={handleEditVendor}
              onCancel={() => setIsEditModalOpen(false)}
              isSubmitting={modalSubmitting}
            />
          </div>
        </div>
      )}

      {isPurchaseModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px'
          }}>
            <h3 style={{ marginTop: 0 }}>➕ Record Purchase</h3>
            {purchaseError && <div style={{ color: 'red', fontSize: '13px', marginBottom: '16px' }}>{purchaseError}</div>}
            <form onSubmit={handleCreatePurchase} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Purchase No.</label>
                <input required value={purchNumber} onChange={e => setPurchNumber(e.target.value)} placeholder="PUR-001" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Total Amount</label>
                <input required type="number" step="any" min="0.01" value={purchTotal} onChange={e => setPurchTotal(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Outstanding Amount</label>
                <input required type="number" step="any" min="0" value={purchOutstanding} onChange={e => setPurchOutstanding(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Status</label>
                <select value={purchStatus} onChange={e => setPurchStatus(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text)' }}>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Partial">Partial</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsPurchaseModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' }}>Cancel</button>
                <button type="submit" disabled={modalSubmitting} style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--accent)', color: '#fff', border: 'none' }}>{modalSubmitting ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px'
          }}>
            <h3 style={{ marginTop: 0 }}>💸 Record Payment</h3>
            <div style={{ fontSize: '13px', marginBottom: '16px', opacity: 0.8 }}>
              Current Outstanding: <strong>${vendor.outstanding_balance.toFixed(2)}</strong>
            </div>
            {paymentError && <div style={{ color: 'red', fontSize: '13px', marginBottom: '16px' }}>{paymentError}</div>}
            <form onSubmit={handleCreatePayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Payment Amount</label>
                <input required type="number" step="any" min="0.01" max={vendor.outstanding_balance} value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Payment Method</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text)' }}>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' }}>Cancel</button>
                <button type="submit" disabled={modalSubmitting} style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--accent)', color: '#fff', border: 'none' }}>{modalSubmitting ? 'Processing...' : 'Confirm Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDetail;
