import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { generateInvoicePDF } from '../../utils/invoicePdf';
import { getProducts, getCustomers, getInventoryByVariant, decrementInventoryLocal, enqueueInvoice } from '../../db/sqliteManager';
import { useSync } from '../../context/SyncContext';
import { useAuth } from '../../context/AuthContext';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { hardwareService } from '../../services/HardwareService';

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
      // Find product by barcode
      const match = products.find(p => p.barcode === barcode || p.sku === barcode);
      if (match) {
        // We can't use addToCart directly here unless we wrap it in a ref or useCallback, 
        // but since `cart` and `products` state closures could be stale, we use functional state updates.
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
      // Delay initialization slightly to ensure the #reader div is mounted
      setTimeout(() => {
        html5QrCode.current = new Html5Qrcode("reader");
        html5QrCode.current.start(
          { facingMode: "environment" }, // Prefer back camera for smartphones
          {
            fps: 10,
            qrbox: { width: 250, height: 150 }, // Wider for barcodes
            aspectRatio: 1.0
          },
          onScanSuccess,
          onScanFailure
        ).catch(err => {
          console.error("Camera start error:", err);
          alert("Could not start camera. Please ensure permissions are granted and you are using HTTPS on mobile.");
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
    
    // Cleanup on unmount
    return () => {
      if (html5QrCode.current && html5QrCode.current.isScanning) {
        html5QrCode.current.stop().then(() => {
          html5QrCode.current?.clear();
        }).catch(() => {});
      }
    };
  }, [scanning]);

  const onScanSuccess = (decodedText: string) => {
    // Return barcode value to the billing screen's search input automatically
    setSearch(decodedText);
    
    // Search for product with this barcode
    const match = products.find(p => p.barcode === decodedText || p.sku === decodedText);
    if (match) {
      addToCart(match);
      setScanning(false); // Stop scanning once successfully added
    } else {
      // If not found, we keep the value in the search bar and notify
      alert(`Scanned Barcode: ${decodedText}. Product not found in catalog.`);
      setScanning(false);
    }
  };

  const onScanFailure = () => {
    // Handle or ignore
  };

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

  // Calculations
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
    
    // Strict Inventory Check
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
          product_name: item.product_name, // For PDF
          quantity: item.quantity,
          unit_price: item.selling_price,
          discount_amount: 0, // Item level discount not implemented in this UI for simplicity
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

      // Write to sync queue
      await enqueueInvoice(payload);
      
      // Update local inventory to prevent double-selling offline
      for (const item of cart) {
        if (!item.isManual) {
          await decrementInventoryLocal(item.variant_id, item.quantity);
        }
      }

      // Try background sync if online
      if (isOnline) {
        forceSync();
      }

      // Save to state to show sharing options
      const custObj = customers.find(c => c.customer_id === customerId) || null;
      setCompletedInvoice({
        invoice: { ...payload, items: itemsPayload },
        customer: custObj
      });
      
      // Auto pop cash drawer if payment received
      if (amountPaid > 0) {
        hardwareService.openCashDrawer().catch(() => {});
      }
    } catch (err: any) {
      alert(err.message || 'Checkout failed');
    }
  };

  const handleNewSale = () => {
    setCart([]);
    setAmountPaid(0);
    setDiscountPercent(0);
    setCustomerId('');
    setCompletedInvoice(null);
  };

  const handleDownloadPDF = () => {
    if (!completedInvoice) return;
    generateInvoicePDF(completedInvoice.invoice, completedInvoice.customer, { name: 'My Retail Store' });
  };

  const handlePrintReceipt = async () => {
    try {
      await hardwareService.printTestReceipt(); // We can implement a real receipt printer later, for now we just test connection
    } catch (err: any) {
      alert("Hardware error: " + err.message);
    }
  };

  const handlePopDrawer = async () => {
    try {
      await hardwareService.openCashDrawer();
    } catch (err: any) {
      alert("Hardware error: " + err.message);
    }
  };

  const handleWhatsAppShare = () => {
    if (!completedInvoice) return;
    const { invoice, customer } = completedInvoice;
    const text = `Hello${customer ? ' ' + customer.name : ''}, your invoice ${invoice.invoice_number} for $${invoice.total_amount.toFixed(2)} is ready!`;
    const phone = customer?.phone ? customer.phone.replace(/[^0-9]/g, '') : '';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleEmailShare = () => {
    if (!completedInvoice) return;
    const { invoice, customer } = completedInvoice;
    const subject = `Invoice ${invoice.invoice_number} from My Retail Store`;
    const body = `Hello${customer ? ' ' + customer.name : ''},\n\nYour invoice ${invoice.invoice_number} for $${invoice.total_amount.toFixed(2)} has been generated.\n\nThank you for your business!`;
    const url = `mailto:${customer?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  const filteredProducts = products.filter(p => p.search_string.includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 40px)', gap: '20px', margin: '-10px', padding: '10px', position: 'relative' }}>
      
      {/* Manual Billing Modal */}
      {showManualBilling && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg)', padding: '24px', borderRadius: '12px', width: '400px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: 0, color: 'var(--text-h)' }}>Manual Entry</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600 }}>Item Name / Description</label>
              <input type="text" value={manualItem.name} onChange={e => setManualItem({...manualItem, name: e.target.value})} style={{ padding: '10px', borderRadius: '6px', background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} placeholder="e.g. Custom Service" />
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Unit Price</label>
                <input type="number" min="0" step="0.01" value={manualItem.price} onChange={e => setManualItem({...manualItem, price: Number(e.target.value)})} style={{ padding: '10px', borderRadius: '6px', background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Quantity</label>
                <input type="number" min="1" value={manualItem.quantity} onChange={e => setManualItem({...manualItem, quantity: Number(e.target.value)})} style={{ padding: '10px', borderRadius: '6px', background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600 }}>Tax Rate (%)</label>
              <input type="number" min="0" value={manualItem.taxRate} onChange={e => setManualItem({...manualItem, taxRate: Number(e.target.value)})} style={{ padding: '10px', borderRadius: '6px', background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button onClick={() => setShowManualBilling(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={addManualItem} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>Add to Cart</button>
            </div>
          </div>
        </div>
      )}

      {/* Left Area: Catalog & Search */}
      <div style={{ flex: 6, display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)', overflowY: 'auto' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Search products by name, SKU, or Barcode..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flexGrow: 1, padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)' }}
          />
          <button 
            onClick={() => setScanning(!scanning)}
            style={{ padding: '0 20px', borderRadius: '8px', border: 'none', background: scanning ? '#ef4444' : 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            {scanning ? 'Cancel Scan' : '📷 Camera Scan'}
          </button>
          <button 
            onClick={() => setShowManualBilling(true)}
            style={{ padding: '0 20px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            ✍️ Manual Entry
          </button>
        </div>

        {scanning && (
          <div style={{ background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
            <div id="reader" style={{ width: '100%' }}></div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
          {filteredProducts.slice(0, 50).map((p, i) => (
            <div 
              key={i} 
              onClick={() => addToCart(p)}
              style={{ padding: '16px', background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-h)' }}>{p.product_name}</h4>
              <span style={{ fontSize: '12px', opacity: 0.7 }}>SKU: {p.sku || 'N/A'}</span>
              <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent)' }}>${p.selling_price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Area: Cart & Checkout / Sharing */}
      <div style={{ flex: 4, display: 'flex', flexDirection: 'column', background: 'var(--code-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
        
        {completedInvoice ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px' }}>🎉</div>
            <h2 style={{ margin: 0, color: '#10b981' }}>Sale Completed!</h2>
            <p style={{ opacity: 0.7, margin: 0 }}>Invoice {completedInvoice.invoice.invoice_number} generated successfully.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '20px' }}>
              <button 
                onClick={handleDownloadPDF}
                style={{ padding: '14px', borderRadius: '8px', background: 'var(--accent)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px' }}
              >
                📄 Download PDF
              </button>
              
              <button 
                onClick={handlePrintReceipt}
                style={{ padding: '14px', borderRadius: '8px', background: 'var(--text-h)', color: 'var(--bg)', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px' }}
              >
                🖨️ Thermal Print Receipt
              </button>
              
              <button 
                onClick={handlePopDrawer}
                style={{ padding: '14px', borderRadius: '8px', background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px' }}
              >
                💵 Pop Cash Drawer
              </button>
              
              <button 
                onClick={handleWhatsAppShare}
                style={{ padding: '14px', borderRadius: '8px', background: '#25D366', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px' }}
              >
                💬 Share via WhatsApp
              </button>
              
              <button 
                onClick={handleEmailShare}
                style={{ padding: '14px', borderRadius: '8px', background: '#ea4335', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px' }}
              >
                ✉️ Share via Email
              </button>
            </div>
            
            <button 
              onClick={handleNewSale}
              style={{ padding: '14px', borderRadius: '8px', background: 'transparent', color: 'var(--text-h)', border: '1px solid var(--border)', fontWeight: 600, cursor: 'pointer', width: '100%', marginTop: '20px' }}
            >
              ➕ Start New Sale
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ margin: '0 0 20px', fontSize: '20px', color: 'var(--text-h)' }}>Current Cart</h2>
            
            <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '40px' }}>Cart is empty</div>
              ) : (
            cart.map(item => (
              <div key={item.variant_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-h)' }}>{item.product_name}</div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>${item.selling_price.toFixed(2)} + {item.tax_rate}% GST</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input 
                    type="number" 
                    value={item.quantity} 
                    onChange={e => updateCartQty(item.variant_id, Number(e.target.value))}
                    style={{ width: '60px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text)' }}
                  />
                  <div style={{ fontWeight: 600, width: '70px', textAlign: 'right' }}>
                    ${(item.quantity * item.selling_price).toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ borderTop: '2px dashed var(--border)', marginTop: '20px', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {isInterState ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span>IGST ({placeOfSupply})</span>
              <span>+ ${totalIgst.toFixed(2)}</span>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>CGST</span>
                <span>+ ${totalCgst.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>SGST ({placeOfSupply})</span>
                <span>+ ${totalSgst.toFixed(2)}</span>
              </div>
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
            <span>Global Discount (%)</span>
            <input 
              type="number" 
              value={discountPercent} 
              onChange={e => setDiscountPercent(Number(e.target.value))} 
              style={{ width: '60px', padding: '4px', textAlign: 'right', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px' }} 
            />
          </div>
          
          <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 700, color: 'var(--text-h)' }}>
            <span>Grand Total</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>Link Customer (Optional)</label>
            <select 
              value={customerId} 
              onChange={e => setCustomerId(e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              <option value="">Walk-In Customer</option>
              {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>Amount Received</label>
            <input 
              type="number" 
              value={amountPaid} 
              onChange={e => setAmountPaid(Number(e.target.value))}
              style={{ padding: '10px', borderRadius: '6px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            style={{ marginTop: '12px', padding: '16px', borderRadius: '8px', background: '#10b981', color: 'white', border: 'none', fontWeight: 700, fontSize: '16px', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', opacity: cart.length === 0 ? 0.5 : 1 }}
          >
            Checkout
          </button>
        </div>
      </>
      )}
      </div>
    </div>
  );
};

export default POS;
