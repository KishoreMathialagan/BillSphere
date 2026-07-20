import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import QRCode from 'qrcode';
import { generateInvoicePDF } from '../../utils/invoicePdf';
import { getProducts, getCustomers, getInventoryByVariant, decrementInventoryLocal, enqueueInvoice } from '../../db/sqliteManager';
import { useSync } from '../../context/SyncContext';
import { useAuth } from '../../context/AuthContext';
import { calculateLineItem, calculateInvoiceTotals, type TaxMode, type DiscountType } from '../../utils/taxEngine';

const UPI_ID = 'your-upi-id@upi'; // 🔧 Replace with your UPI ID

const MobilePOS: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [taxMode, setTaxMode] = useState<TaxMode>('EXCLUSIVE');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI'>('CASH');
  const [completedInvoice, setCompletedInvoice] = useState<any>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'manual'>('products');
  const [manualItem, setManualItem] = useState({ name: '', price: 0, quantity: 1, taxRate: 0 });
  const html5QrCode = useRef<Html5Qrcode | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const { isOnline, forceSync, inventoryMode } = useSync();
  const { tenantState } = useAuth();

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (paymentMode === 'UPI' && cart.length > 0 && qrCanvasRef.current) {
      const { totals } = getCalculatedCart();
      const upiString = `upi://pay?pa=${UPI_ID}&pn=VendorMind&am=${totals.totalAmount.toFixed(2)}&cu=INR`;
      QRCode.toCanvas(qrCanvasRef.current, upiString, { width: 200, margin: 1 }, () => {});
    }
  }, [paymentMode, cart]);

  useEffect(() => {
    if (scanning) {
      setTimeout(() => {
        html5QrCode.current = new Html5Qrcode("mobile-reader");
        html5QrCode.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decoded) => {
            const match = products.find(p => p.barcode === decoded || p.sku === decoded);
            if (match) { addToCart(match); setScanning(false); }
            else { alert(`Product not found: ${decoded}`); setScanning(false); }
          },
          () => {}
        ).catch(() => { alert("Camera error"); setScanning(false); });
      }, 100);
    } else {
      if (html5QrCode.current?.isScanning) {
        html5QrCode.current.stop().then(() => { html5QrCode.current?.clear(); html5QrCode.current = null; }).catch(() => {});
      }
    }
    return () => {
      if (html5QrCode.current?.isScanning) {
        html5QrCode.current.stop().then(() => html5QrCode.current?.clear()).catch(() => {});
      }
    };
  }, [scanning]);

  const fetchData = async () => {
    try {
      const prodRes = await getProducts();
      const custRes = await getCustomers();
      const flatList = (prodRes || []).map((p: any) => ({
        ...p,
        search_string: `${p.product_name} ${p.barcode || ''} ${p.sku || ''}`.toLowerCase()
      }));
      setProducts(flatList);
      setCustomers(custRes || []);
    } catch (err) { console.error(err); }
  };

  const addToCart = (variant: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.variant_id === variant.variant_id);
      if (existing) return prev.map(i => i.variant_id === variant.variant_id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...variant, quantity: 1, discountType: 'PERCENTAGE' as DiscountType, discountValue: 0 }];
    });
    setSearch('');
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) setCart(c => c.filter(i => i.variant_id !== id));
    else setCart(c => c.map(i => i.variant_id === id ? { ...i, quantity: qty } : i));
  };

  const addManualItem = () => {
    if (!manualItem.name || manualItem.price <= 0) return alert('Enter valid details');
    setCart(c => [...c, {
      variant_id: `manual-${Date.now()}`,
      product_name: manualItem.name,
      selling_price: manualItem.price,
      tax_rate: manualItem.taxRate,
      hsn_code: 'Custom',
      quantity: manualItem.quantity,
      discountType: 'PERCENTAGE' as DiscountType,
      discountValue: 0,
      isManual: true
    }]);
    setManualItem({ name: '', price: 0, quantity: 1, taxRate: 0 });
    setActiveTab('products');
    setCartOpen(true);
  };

  const getCalculatedCart = () => {
    const customer = customers.find(c => c.customer_id === customerId);
    const sellerState = tenantState || 'Tamil Nadu';
    const buyerState = customer?.state || sellerState;
    const calculatedItems = cart.map(item => ({
      ...item,
      ...calculateLineItem({
        quantity: item.quantity, unitPrice: item.selling_price,
        discountType: item.discountType || 'PERCENTAGE', discountValue: item.discountValue || 0,
        gstRate: item.tax_rate, isInclusive: taxMode === 'INCLUSIVE',
        sellerState, buyerState
      })
    }));
    return { calculatedItems, totals: calculateInvoiceTotals(calculatedItems), buyerState };
  };

  const { calculatedItems, totals, buyerState } = getCalculatedCart();
  const outstanding = Math.max(0, totals.totalAmount - amountPaid);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (inventoryMode === 'Strict') {
      for (const item of cart) {
        if (!item.isManual) {
          const qty = await getInventoryByVariant(item.variant_id);
          if (qty < item.quantity) return alert(`Out of Stock: ${item.product_name}. Only ${qty} left.`);
        }
      }
    }
    try {
      const payload = {
        invoice_number: `POS-${Date.now()}`,
        branch_id: 'MAIN',
        total_amount: totals.totalAmount,
        outstanding_amount: outstanding,
        total_tax: totals.totalTax,
        total_cgst: totals.totalCgst,
        total_sgst: totals.totalSgst,
        total_igst: totals.totalIgst,
        total_discount: totals.totalDiscount,
        place_of_supply: buyerState,
        is_tax_inclusive: taxMode === 'INCLUSIVE',
        tax_mode: taxMode,
        status: paymentMode === 'UPI' ? 'Paid' : (amountPaid >= totals.totalAmount ? 'Paid' : 'Partial'),
        offline_created_at: new Date().toISOString(),
        items: calculatedItems.map(item => ({
          variant_id: item.variant_id, product_name: item.product_name,
          quantity: item.quantity, unit_price: item.selling_price,
          discount_type: item.discountType, discount_value: item.discountValue,
          hsn_code: item.hsn_code, gst_rate: item.tax_rate
        })),
        customer_id: customerId || null,
        payment_mode: paymentMode
      };
      await enqueueInvoice(payload);
      for (const item of cart) {
        if (!item.isManual) await decrementInventoryLocal(item.variant_id, item.quantity);
      }
      if (isOnline) forceSync();
      setCompletedInvoice({ invoice: { ...payload, items: calculatedItems }, customer: customers.find(c => c.customer_id === customerId) || null });
      setCartOpen(false);
    } catch (err: any) { alert(err.message || 'Checkout failed'); }
  };

  const startNewSale = () => {
    setCart([]); setCustomerId(''); setAmountPaid(0);
    setPaymentMode('CASH'); setCompletedInvoice(null);
  };

  const filteredProducts = products.filter(p => {
    const q = search.toLowerCase().trim();
    return !q || p.search_string?.includes(q);
  });

  // ── SALE COMPLETED SCREEN ──
  if (completedInvoice) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0fdf4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '16px' }}>
        <div style={{ fontSize: '64px' }}>🎉</div>
        <h2 style={{ margin: 0, color: '#16a34a', fontSize: '24px', fontWeight: 800 }}>Sale Complete!</h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>{completedInvoice.invoice.invoice_number}</p>
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '360px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#6b7280' }}>Total</span>
            <span style={{ fontWeight: 700, fontSize: '20px' }}>₹{completedInvoice.invoice.total_amount.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#6b7280' }}>GST</span>
            <span>₹{completedInvoice.invoice.total_tax.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280' }}>Payment</span>
            <span style={{ fontWeight: 600, color: '#1a5fa8' }}>{completedInvoice.invoice.payment_mode}</span>
          </div>
        </div>
        <button onClick={() => generateInvoicePDF(completedInvoice.invoice, completedInvoice.customer, { name: 'Vendor Mind' })}
          style={{ width: '100%', maxWidth: '360px', padding: '14px', background: '#1a5fa8', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>
          📄 Download PDF
        </button>
        <button onClick={startNewSale}
          style={{ width: '100%', maxWidth: '360px', padding: '14px', background: 'white', color: '#374151', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>
          + New Sale
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: '80px', position: 'relative' }}>

      {/* ── TOP BAR ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#004741', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search product / barcode..."
          style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: 'none', fontSize: '15px', background: 'rgba(255,255,255,0.15)', color: 'white', outline: 'none' }}
        />
        <button onClick={() => setScanning(true)}
          style={{ padding: '10px 14px', background: '#16a34a', border: 'none', borderRadius: '10px', color: 'white', fontSize: '20px', cursor: 'pointer' }}>
          📷
        </button>
      </div>

      {/* ── TAX MODE TOGGLE ── */}
      <div style={{ display: 'flex', gap: '8px', padding: '10px 16px', background: 'white', borderBottom: '1px solid #f3f4f6' }}>
        {(['EXCLUSIVE', 'INCLUSIVE'] as TaxMode[]).map(m => (
          <button key={m} onClick={() => setTaxMode(m)}
            style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              background: taxMode === m ? '#004741' : '#f3f4f6', color: taxMode === m ? 'white' : '#6b7280' }}>
            {m}
          </button>
        ))}
        <button onClick={() => setActiveTab(activeTab === 'products' ? 'manual' : 'products')}
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
            background: activeTab === 'manual' ? '#7c3aed' : '#f3f4f6', color: activeTab === 'manual' ? 'white' : '#6b7280' }}>
          ✏️ Manual
        </button>
      </div>

      {/* ── CAMERA SCANNER ── */}
      {scanning && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <p style={{ color: 'white', fontSize: '16px', fontWeight: 600 }}>📷 Point camera at barcode</p>
          <div id="mobile-reader" style={{ width: '300px', borderRadius: '12px', overflow: 'hidden' }} />
          <button onClick={() => setScanning(false)}
            style={{ padding: '12px 32px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>
            ✕ Cancel
          </button>
        </div>
      )}

      {/* ── MANUAL ENTRY ── */}
      {activeTab === 'manual' && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Manual Item Entry</h3>
          {[
            { label: 'Item Name', key: 'name', type: 'text', placeholder: 'e.g. Custom Service' },
            { label: 'Price (₹)', key: 'price', type: 'number', placeholder: '0.00' },
            { label: 'Quantity', key: 'quantity', type: 'number', placeholder: '1' },
            { label: 'GST Rate (%)', key: 'taxRate', type: 'number', placeholder: '0' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder}
                value={(manualItem as any)[f.key] || ''}
                onChange={e => setManualItem(m => ({ ...m, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>
          ))}
          <button onClick={addManualItem}
            style={{ padding: '14px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>
            + Add to Cart
          </button>
        </div>
      )}

      {/* ── PRODUCT GRID ── */}
      {activeTab === 'products' && (
        <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {filteredProducts.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              {search ? 'No products found' : 'No products loaded. Sync first.'}
            </div>
          )}
          {filteredProducts.map(p => (
            <button key={p.variant_id} onClick={() => addToCart(p)}
              style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px', textAlign: 'left', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.1s', position: 'relative' }}>
              {cart.find(i => i.variant_id === p.variant_id) && (
                <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#004741', color: 'white', borderRadius: '999px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                  {cart.find(i => i.variant_id === p.variant_id)?.quantity}
                </div>
              )}
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '4px', lineHeight: 1.3 }}>{p.product_name}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>{p.sku}</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#004741' }}>₹{Number(p.selling_price).toFixed(2)}</div>
            </button>
          ))}
        </div>
      )}

      {/* ── BOTTOM CART BAR ── */}
      {cart.length > 0 && !cartOpen && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, padding: '12px 16px', background: '#004741', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{cart.reduce((s, i) => s + i.quantity, 0)} items</div>
            <div style={{ color: 'white', fontSize: '18px', fontWeight: 800 }}>₹{totals.totalAmount.toFixed(2)}</div>
          </div>
          <button onClick={() => setCartOpen(true)}
            style={{ padding: '12px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
            🛒 View Cart & Pay
          </button>
        </div>
      )}

      {/* ── CART BOTTOM SHEET ── */}
      {cartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.5)' }} onClick={() => setCartOpen(false)}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'white', borderRadius: '20px 20px 0 0', maxHeight: '90vh', overflowY: 'auto', padding: '0 0 32px' }}
            onClick={e => e.stopPropagation()}>

            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: '40px', height: '4px', background: '#e5e7eb', borderRadius: '999px' }} />
            </div>

            <div style={{ padding: '0 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>🛒 Cart ({cart.length} items)</h3>
                <button onClick={() => setCart([])} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Clear All</button>
              </div>

              {/* Cart Items */}
              {cart.map(item => {
                const calc = calculatedItems.find(c => c.variant_id === item.variant_id);
                return (
                  <div key={item.variant_id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{item.product_name}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>₹{Number(item.selling_price).toFixed(2)} × {item.quantity}</div>
                      {calc && calc.gst_amount > 0 && (
                        <div style={{ fontSize: '11px', color: '#7c3aed' }}>GST: ₹{calc.gst_amount.toFixed(2)}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => updateQty(item.variant_id, item.quantity - 1)}
                        style={{ width: '28px', height: '28px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ fontSize: '15px', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQty(item.variant_id, item.quantity + 1)}
                        style={{ width: '28px', height: '28px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#004741', minWidth: '60px', textAlign: 'right' }}>
                      ₹{calc ? calc.subtotal.toFixed(2) : (item.selling_price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                );
              })}

              {/* Totals */}
              <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '14px', margin: '16px 0' }}>
                {[
                  { label: 'Taxable Amount', val: `₹${(totals.totalAmount - totals.totalTax).toFixed(2)}` },
                  { label: 'Total GST', val: `₹${totals.totalTax.toFixed(2)}`, color: '#7c3aed' },
                  { label: 'Round Off', val: `₹${totals.roundOff.toFixed(2)}` },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                    <span style={{ color: '#6b7280' }}>{r.label}</span>
                    <span style={{ color: r.color || '#374151' }}>{r.val}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #e5e7eb', fontSize: '18px', fontWeight: 800 }}>
                  <span>Total</span>
                  <span style={{ color: '#004741' }}>₹{totals.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Customer */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Customer</label>
                <select value={customerId} onChange={e => setCustomerId(e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', background: 'white' }}>
                  <option value="">Walk-In Customer</option>
                  {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.name}</option>)}
                </select>
              </div>

              {/* Payment Mode */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Payment Mode</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['CASH', 'UPI'] as const).map(m => (
                    <button key={m} onClick={() => { setPaymentMode(m); if (m === 'UPI') setAmountPaid(totals.totalAmount); }}
                      style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 700,
                        background: paymentMode === m ? '#004741' : '#f3f4f6', color: paymentMode === m ? 'white' : '#374151' }}>
                      {m === 'CASH' ? '💵 Cash' : '📱 UPI'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash: Amount Received */}
              {paymentMode === 'CASH' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Amount Received (₹)</label>
                  <input type="number" value={amountPaid || ''} onChange={e => setAmountPaid(Number(e.target.value))}
                    placeholder="0.00"
                    style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '16px', boxSizing: 'border-box' }}
                  />
                  {amountPaid > totals.totalAmount && (
                    <div style={{ marginTop: '6px', fontSize: '14px', color: '#16a34a', fontWeight: 600 }}>
                      💰 Change: ₹{(amountPaid - totals.totalAmount).toFixed(2)}
                    </div>
                  )}
                </div>
              )}

              {/* UPI QR */}
              {paymentMode === 'UPI' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '16px', background: '#f0fdf4', borderRadius: '12px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#16a34a' }}>📱 Scan to Pay ₹{totals.totalAmount.toFixed(2)}</div>
                  <canvas ref={qrCanvasRef} style={{ borderRadius: '8px' }} />
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>UPI: <strong>{UPI_ID}</strong></div>
                  <div style={{ fontSize: '12px', color: '#d97706', fontWeight: 600 }}>⚠️ Tap Checkout after customer pays</div>
                </div>
              )}

              {/* Checkout Button */}
              <button onClick={handleCheckout}
                style={{ width: '100%', padding: '16px', background: '#004741', color: 'white', border: 'none', borderRadius: '14px', fontSize: '18px', fontWeight: 800, cursor: 'pointer', marginTop: '8px' }}>
                ✅ Checkout — ₹{totals.totalAmount.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobilePOS; 