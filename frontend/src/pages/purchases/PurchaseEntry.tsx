import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

const PurchaseEntry: React.FC = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [vendorId, setVendorId] = useState('');
  const [purchaseNumber, setPurchaseNumber] = useState('');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  
  // Line items
  const [items, setItems] = useState<any[]>([
    { id: Date.now(), variant_id: '', quantity: 1, unit_price: 0, subtotal: 0 }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [vendRes, prodRes] = await Promise.all([
          api.get('/vendors'),
          api.get('/inventory/products')
        ]);
        setVendors(vendRes.data || []);
        setProducts(prodRes.data || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load vendors or products.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleItemChange = (id: number, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // If variant changes, try to auto-fill purchase_price
        if (field === 'variant_id' && value) {
          // find the variant in products
          for (const p of products) {
            const v = p.variants.find((v: any) => v.variant_id === value);
            if (v) {
              updated.unit_price = v.purchase_price || 0;
              break;
            }
          }
        }
        updated.subtotal = updated.quantity * updated.unit_price;
        return updated;
      }
      return item;
    }));
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), variant_id: '', quantity: 1, unit_price: 0, subtotal: 0 }]);
  };

  const handleRemoveItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  const outstandingAmount = Math.max(0, totalAmount - paidAmount);
  const status = paidAmount >= totalAmount ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Unpaid');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) {
      setError('Please select a vendor.');
      return;
    }
    if (!purchaseNumber) {
      setError('Please enter a purchase number.');
      return;
    }
    
    // Validate items
    const validItems = items.filter(item => item.variant_id && item.quantity > 0);
    if (validItems.length === 0) {
      setError('Please add at least one valid item to the purchase.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const payload = {
        purchase_number: purchaseNumber,
        total_amount: totalAmount,
        outstanding_amount: outstandingAmount,
        status: status,
        items: validItems.map(item => ({
          variant_id: item.variant_id,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          subtotal: Number(item.subtotal)
        }))
      };

      await api.post(`/vendors/${vendorId}/purchases`, payload);
      navigate('/app/purchases');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to submit purchase entry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading form data...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left', maxWidth: '900px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to="/app/purchases" style={{ textDecoration: 'none', color: 'var(--accent)', fontWeight: 500 }}>
          ← Back to Purchases
        </Link>
      </div>

      <div style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '32px'
      }}>
        <h2 style={{ margin: '0 0 24px', fontSize: '24px', fontWeight: 700, color: 'var(--text-h)' }}>
          Record Purchase Entry
        </h2>

        {error && <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', opacity: 0.8 }}>
                Select Vendor *
              </label>
              <select
                required
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)' }}
              >
                <option value="">-- Choose a Vendor --</option>
                {vendors.map(v => (
                  <option key={v.vendor_id} value={v.vendor_id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', opacity: 0.8 }}>
                Purchase Reference No. *
              </label>
              <input
                required
                type="text"
                value={purchaseNumber}
                onChange={(e) => setPurchaseNumber(e.target.value)}
                placeholder="e.g. INV-2026-001"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)' }}
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }}></div>

          <div>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: 'var(--text-h)' }}>Line Items (Inventory will be updated)</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {items.map((item) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', opacity: 0.8 }}>Product / Variant</label>
                    <select
                      required
                      value={item.variant_id}
                      onChange={(e) => handleItemChange(item.id, 'variant_id', e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text)' }}
                    >
                      <option value="">-- Select Product --</option>
                      {products.map(p => (
                        <optgroup key={p.product_id} label={p.name}>
                          {p.variants.map((v: any) => (
                            <option key={v.variant_id} value={v.variant_id}>
                              {v.sku ? `${v.sku} - ` : ''} {p.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', opacity: 0.8 }}>Quantity</label>
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', opacity: 0.8 }}>Unit Price ($)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="any"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(item.id, 'unit_price', Number(e.target.value))}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', opacity: 0.8 }}>Subtotal</label>
                    <input
                      disabled
                      value={`$${item.subtotal.toFixed(2)}`}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', opacity: 0.7 }}
                    />
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      style={{ padding: '10px', borderRadius: '6px', background: 'transparent', border: '1px solid #fecaca', color: '#ef4444', cursor: 'pointer' }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              style={{ marginTop: '16px', padding: '8px 16px', borderRadius: '6px', background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
            >
              + Add Another Item
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }}></div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 600, color: 'var(--text-h)' }}>
                <span>Total Amount:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Amount Paid Now:</span>
                <input
                  type="number"
                  min="0"
                  max={totalAmount}
                  step="any"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  style={{ width: '120px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text)', textAlign: 'right' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 600, color: outstandingAmount > 0 ? '#ef4444' : '#10b981' }}>
                <span>Balance Due:</span>
                <span>${outstandingAmount.toFixed(2)}</span>
              </div>

            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => navigate('/app/purchases')}
              disabled={submitting}
              style={{ padding: '12px 24px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '12px 24px', borderRadius: '8px', background: 'var(--accent)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 600 }}
            >
              {submitting ? 'Saving...' : 'Confirm Purchase & Update Inventory'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default PurchaseEntry;
