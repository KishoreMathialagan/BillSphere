import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { generateInvoicePDF } from '../../utils/invoicePdf';
import { getProducts, getCustomers, getInventoryByVariant, decrementInventoryLocal, enqueueInvoice } from '../../db/sqliteManager';
import { useSync } from '../../context/SyncContext';
import { useAuth } from '../../context/AuthContext';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { hardwareService } from '../../services/HardwareService';
import { NeuoCard } from '../../components/molecules/NeuoCard';
import { Button } from '../../components/atoms/Button';
import { Input } from '../../components/atoms/Input';

const POS: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  // Cart & Checkout State
  const [cart, setCart] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [completedInvoice, setCompletedInvoice] = useState<any>(null);
  
  // Scanner State
  const [scanning, setScanning] = useState(false);
  const html5QrCode = useRef<Html5Qrcode | null>(null);

  // Manual Billing State
  const [showManualBilling, setShowManualBilling] = useState(false);
  const [manualItem, setManualItem] = useState({ name: '', price: 0, quantity: 1, taxRate: 0 });

  const { isOnline, forceSync, inventoryMode } = useSync();
  const { tenantState } = useAuth();

  // Hardware Scanner Integration
  useBarcodeScanner({
    onScan: (barcode) => {
      const match = products.find(p => p.barcode === barcode || p.sku === barcode);
      if (match) {
        setCart(prevCart => {
          const existing = prevCart.find(i => i.variant_id === match.variant_id);
          if (existing) {
            return prevCart.map(i => i.variant_id === match.variant_id ? { ...i, quantity: i.quantity + 1 } : i);
          } else {
            return [...prevCart, { ...match, quantity: 1, discount: 0 }];
          }
        });
      }
    },
    enabled: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const prodRes = await getProducts();
      const custRes = await getCustomers();
      
      const flatList: any[] = [];
      (prodRes || []).forEach((p: any) => {
        flatList.push({
          ...p,
          search_string: `${p.product_name} ${p.barcode || ''} ${p.sku || ''}`.toLowerCase()
        });
      });
      setProducts(flatList);
      setCustomers(custRes || []);
    } catch (err) {
      console.error('Failed to load POS data from local DB', err);
    }
  };

  useEffect(() => {
    if (scanning) {
      setTimeout(() => {
        html5QrCode.current = new Html5Qrcode("reader");
        html5QrCode.current.start(
          { facingMode: "environment" }, 
          { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0 },
          onScanSuccess,
          onScanFailure
        ).catch(err => {
          console.error("Camera start error:", err);
          alert("Could not start camera.");
          setScanning(false);
        });
      }, 100);
    } else {
      if (html5QrCode.current && html5QrCode.current.isScanning) {
        html5QrCode.current.stop().then(() => {
          html5QrCode.current?.clear();
          html5QrCode.current = null;
        }).catch(err => console.error("Error stopping scanner", err));
      }
    }
    
    return () => {
      if (html5QrCode.current && html5QrCode.current.isScanning) {
        html5QrCode.current.stop().then(() => {
          html5QrCode.current?.clear();
        }).catch(() => {});
      }
    };
  }, [scanning]);

  const onScanSuccess = (decodedText: string) => {
    setSearch(decodedText);
    const match = products.find(p => p.barcode === decodedText || p.sku === decodedText);
    if (match) {
      addToCart(match);
      setScanning(false);
    } else {
      alert(`Scanned Barcode: ${decodedText}. Product not found in catalog.`);
      setScanning(false);
    }
  };

  const onScanFailure = () => {};

  const addToCart = (variant: any) => {
    const existing = cart.find(i => i.variant_id === variant.variant_id);
    if (existing) {
      setCart(cart.map(i => i.variant_id === variant.variant_id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...variant, quantity: 1, discount: 0 }]);
    }
  };

  const updateCartQty = (variant_id: string, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter(i => i.variant_id !== variant_id));
    } else {
      setCart(cart.map(i => i.variant_id === variant_id ? { ...i, quantity: qty } : i));
    }
  };

  const addManualItem = () => {
    if (!manualItem.name || manualItem.price <= 0 || manualItem.quantity <= 0) {
      alert("Please enter valid details for the manual item");
      return;
    }
    const customProduct = {
      variant_id: `manual-${Date.now()}`,
      product_name: manualItem.name,
      selling_price: manualItem.price,
      tax_rate: manualItem.taxRate,
      hsn_code: 'Custom',
      quantity: manualItem.quantity,
      discount: 0,
      isManual: true,
    };
    setCart([...cart, customProduct]);
    setShowManualBilling(false);
    setManualItem({ name: '', price: 0, quantity: 1, taxRate: 0 });
  };

  const calcTotals = () => {
    let subtotal = 0;
    let totalTax = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    
    const customer = customers.find(c => c.customer_id === customerId);
    const placeOfSupply = customer?.state || tenantState || 'Unknown';
    const isInterState = placeOfSupply !== tenantState && placeOfSupply !== 'Unknown';
    
    cart.forEach(item => {
      const itemSubtotal = item.quantity * item.selling_price;
      const itemTax = itemSubtotal * (item.tax_rate / 100);
      subtotal += itemSubtotal;
      totalTax += itemTax;
      
      if (isInterState) {
        totalIgst += itemTax;
      } else {
        totalCgst += itemTax / 2;
        totalSgst += itemTax / 2;
      }
    });

    const discountAmount = subtotal * (discountPercent / 100);
    const totalAmount = subtotal + totalTax - discountAmount;
    
    return { subtotal, totalTax, totalCgst, totalSgst, totalIgst, discountAmount, totalAmount, placeOfSupply, isInterState };
  };

  const { subtotal, totalTax, totalCgst, totalSgst, totalIgst, discountAmount, totalAmount, placeOfSupply, isInterState } = calcTotals();
  const outstandingAmount = Math.max(0, totalAmount - amountPaid);

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Cart is empty');
    
    if (inventoryMode === "Strict") {
      for (const item of cart) {
        if (!item.isManual) {
          const qty = await getInventoryByVariant(item.variant_id);
          if (qty < item.quantity) {
            alert(`Out of Stock: Cannot sell ${item.quantity} of ${item.product_name}. Only ${qty} left locally.`);
            return;
          }
        }
      }
    }
    
    try {
      const itemsPayload = cart.map(item => {
        const itemSubtotal = item.quantity * item.selling_price;
        const itemTax = itemSubtotal * (item.tax_rate / 100);
        return {
          variant_id: item.variant_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.selling_price,
          discount_amount: 0,
          hsn_code: item.hsn_code,
          tax_rate: item.tax_rate,
          tax_amount: itemTax,
          cgst_amount: isInterState ? 0 : itemTax / 2,
          sgst_amount: isInterState ? 0 : itemTax / 2,
          igst_amount: isInterState ? itemTax : 0,
          subtotal: itemSubtotal
        };
      });

      const payload = {
        invoice_number: `POS-${Date.now()}`,
        total_amount: totalAmount,
        outstanding_amount: outstandingAmount,
        total_tax: totalTax,
        total_cgst: totalCgst,
        total_sgst: totalSgst,
        total_igst: totalIgst,
        place_of_supply: placeOfSupply,
        total_discount: discountAmount,
        status: amountPaid >= totalAmount ? 'Paid' : 'Partial',
        offline_created_at: new Date().toISOString(),
        items: itemsPayload,
        customer_id: customerId || null
      };

      await enqueueInvoice(payload);
      
      for (const item of cart) {
        if (!item.isManual) {
          await decrementInventoryLocal(item.variant_id, item.quantity);
        }
      }

      if (isOnline) {
        forceSync();
      }

      const custObj = customers.find(c => c.customer_id === customerId) || null;
      setCompletedInvoice({
        invoice: { ...payload, items: itemsPayload },
        customer: custObj
      });
      
      if (amountPaid > 0) {
        hardwareService.openCashDrawer().catch(() => {});
      }
    } catch (err: any) {
      alert(err.message || 'Checkout failed');
    }
  };

  const handleDownloadPDF = () => {
    if (!completedInvoice) return;
    generateInvoicePDF(completedInvoice.invoice, completedInvoice.customer, { name: 'Vendor Mind' });
  };

  const filteredProducts = products.filter(p => p.search_string.includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', gap: 'var(--space-6)', height: 'calc(100vh - 120px)' }}>
      
      {/* Manual Billing Modal */}
      {showManualBilling && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <NeuoCard style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 className="heading-3">Manual Entry</h3>
            
            <Input 
              label="Item Name / Description" 
              value={manualItem.name} 
              onChange={e => setManualItem({...manualItem, name: e.target.value})} 
              placeholder="e.g. Custom Service" 
            />
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <Input 
                type="number" min="0" step="0.01" label="Unit Price" 
                value={manualItem.price} 
                onChange={e => setManualItem({...manualItem, price: Number(e.target.value)})} 
              />
              <Input 
                type="number" min="1" label="Quantity" 
                value={manualItem.quantity} 
                onChange={e => setManualItem({...manualItem, quantity: Number(e.target.value)})} 
              />
            </div>
            
            <Input 
              type="number" min="0" label="Tax Rate (%)" 
              value={manualItem.taxRate} 
              onChange={e => setManualItem({...manualItem, taxRate: Number(e.target.value)})} 
            />
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <Button variant="ghost" onClick={() => setShowManualBilling(false)} style={{ flex: 1 }}>Cancel</Button>
              <Button variant="filled" onClick={addManualItem} style={{ flex: 1 }}>Add to Cart</Button>
            </div>
          </NeuoCard>
        </div>
      )}

      {/* Left Area: Catalog & Search (70%) */}
      <div style={{ flex: 7, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <div style={{ flexGrow: 1 }}>
            <Input 
              placeholder="Search products by name, SKU, or Barcode..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              leftIcon={<span>🔍</span>}
            />
          </div>
          <Button 
            variant={scanning ? 'danger' : 'neuo'} 
            onClick={() => setScanning(!scanning)}
          >
            {scanning ? 'Cancel Scan' : '📷 Camera'}
          </Button>
          <Button variant="neuo" onClick={() => setShowManualBilling(true)}>
            ✍️ Manual Entry
          </Button>
        </div>

        {scanning && (
          <div style={{ background: '#000', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div id="reader" style={{ width: '100%' }}></div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)', overflowY: 'auto', padding: 'var(--space-2)' }}>
          {filteredProducts.slice(0, 50).map((p, i) => (
            <NeuoCard 
              key={i} 
              onClick={() => addToCart(p)}
              style={{ cursor: 'pointer', transition: 'transform 0.1s', display: 'flex', flexDirection: 'column', gap: '8px', padding: 'var(--space-4)' }}
            >
              <h4 className="body" style={{ margin: 0, fontWeight: 600 }}>{p.product_name}</h4>
              <span className="body-sm" style={{ opacity: 0.7 }}>SKU: {p.sku || 'N/A'}</span>
              <span className="metric-md" style={{ color: 'var(--color-cyprus)' }}>₹{p.selling_price.toFixed(2)}</span>
            </NeuoCard>
          ))}
        </div>
      </div>

      {/* Right Area: Cart & Checkout (30%) */}
      <NeuoCard style={{ flex: 3, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
        
        {completedInvoice ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 'var(--space-6)', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>🎉</div>
            <h2 className="heading-2" style={{ color: 'var(--color-success)', marginBottom: 'var(--space-2)' }}>Sale Completed!</h2>
            <p className="body" style={{ opacity: 0.7, marginBottom: 'var(--space-6)' }}>Invoice {completedInvoice.invoice.invoice_number} generated successfully.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%' }}>
              <Button variant="filled" onClick={handleDownloadPDF}>📄 Download PDF</Button>
              <Button variant="neuo" onClick={() => hardwareService.printTestReceipt().catch(e => alert(e))}>🖨️ Thermal Receipt</Button>
              <Button variant="neuo" onClick={() => hardwareService.openCashDrawer().catch(e => alert(e))}>💵 Pop Drawer</Button>
              <Button variant="neuo" onClick={() => setCompletedInvoice(null)}>➕ Start New Sale</Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-sand-dark)' }}>
              <h2 className="heading-3" style={{ margin: 0 }}>Current Cart</h2>
            </div>
            
            <div style={{ flexGrow: 1, overflowY: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '40px' }} className="body">Cart is empty</div>
              ) : (
                cart.map(item => (
                  <div key={item.variant_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'rgba(255,255,255,0.4)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ flexGrow: 1 }}>
                      <div className="body" style={{ fontWeight: 600 }}>{item.product_name}</div>
                      <div className="body-sm" style={{ opacity: 0.7 }}>₹{item.selling_price.toFixed(2)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <input 
                        type="number" 
                        value={item.quantity} 
                        onChange={e => updateCartQty(item.variant_id, Number(e.target.value))}
                        style={{ width: '50px', padding: '4px', borderRadius: '4px', border: '1px solid var(--color-sand-dark)', background: 'var(--color-sand)', textAlign: 'center' }}
                      />
                      <div className="body" style={{ fontWeight: 600, width: '60px', textAlign: 'right' }}>
                        ₹{(item.quantity * item.selling_price).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: 'var(--space-4)', background: 'var(--color-sand-dark)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }} className="body">
                  <span style={{ opacity: 0.7 }}>Subtotal</span>
                  <span style={{ fontWeight: 600 }}>₹{subtotal.toFixed(2)}</span>
                </div>
                {totalTax > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }} className="body">
                    <span style={{ opacity: 0.7 }}>Tax</span>
                    <span style={{ fontWeight: 600 }}>₹{totalTax.toFixed(2)}</span>
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }} className="body">
                  <span style={{ opacity: 0.7 }}>Discount (%)</span>
                  <input 
                    type="number" 
                    value={discountPercent} 
                    onChange={e => setDiscountPercent(Number(e.target.value))} 
                    style={{ width: '60px', padding: '4px', textAlign: 'right', background: 'var(--color-sand)', border: 'none', borderRadius: '4px', boxShadow: 'var(--shadow-neuo-inset)' }} 
                  />
                </div>
                
                <div style={{ borderTop: '1px dashed rgba(0,0,0,0.1)', margin: 'var(--space-2) 0' }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="heading-3">Total</span>
                  <span className="metric-md" style={{ color: 'var(--color-cyprus)' }}>₹{totalAmount.toFixed(2)}</span>
                </div>

                <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div>
                    <label className="body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Customer</label>
                    <select 
                      value={customerId} 
                      onChange={e => setCustomerId(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-md)', background: 'var(--color-sand)', border: 'none', boxShadow: 'var(--shadow-neuo-inset)' }}
                    >
                      <option value="">Walk-In Customer</option>
                      {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Amount Received (₹)</label>
                    <Input 
                      type="number" 
                      value={amountPaid || ''} 
                      onChange={e => setAmountPaid(Number(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>

                  <Button 
                    variant="filled" 
                    size="lg"
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    style={{ marginTop: 'var(--space-2)', width: '100%' }}
                  >
                    Checkout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </NeuoCard>
    </div>
  );
};

export default POS;
