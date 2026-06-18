import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Transfers: React.FC = () => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // New Transfer State
  const [showNew, setShowNew] = useState(false);
  const [fromBranch, setFromBranch] = useState('');
  const [toBranch, setToBranch] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transRes, branchRes, prodRes] = await Promise.all([
        api.get('/transfers'),
        api.get('/branches'),
        api.get('/inventory/products')
      ]);
      setTransfers(transRes.data);
      setBranches(branchRes.data);
      
      const flatList: any[] = [];
      (prodRes.data || []).forEach((p: any) => {
        p.variants.forEach((v: any) => {
          flatList.push({ ...v, product_name: p.name });
        });
      });
      setProducts(flatList);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = () => {
    if (!selectedVariant || quantity <= 0) return;
    const prod = products.find(p => p.variant_id === selectedVariant);
    if (!prod) return;
    setCart([...cart, { variant_id: selectedVariant, product_name: prod.product_name, sku: prod.sku, quantity }]);
    setSelectedVariant('');
    setQuantity(1);
  };

  const handleCreateTransfer = async () => {
    if (!fromBranch || !toBranch || cart.length === 0) return alert("Fill all fields and add items.");
    try {
      await api.post('/transfers', {
        from_branch_id: fromBranch,
        to_branch_id: toBranch,
        items: cart.map(i => ({ variant_id: i.variant_id, quantity: i.quantity }))
      });
      setShowNew(false);
      setCart([]);
      setFromBranch('');
      setToBranch('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to create transfer");
    }
  };

  const handleAction = async (transferId: string, action: 'dispatch' | 'receive') => {
    try {
      await api.post(`/transfers/${transferId}/${action}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || `Failed to ${action} transfer`);
    }
  };

  const getBranchName = (id: string) => {
    return branches.find(b => b.branch_id === id)?.branch_name || id;
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Inter-Branch Transfers</h1>
        <button onClick={() => setShowNew(!showNew)} style={{ padding: '10px 20px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
          {showNew ? 'Cancel' : '+ New Transfer'}
        </button>
      </div>

      {showNew && (
        <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '20px' }}>
          <h2>Create Transfer</h2>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label>From Branch (Origin)</label>
              <select value={fromBranch} onChange={e => setFromBranch(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                <option value="">Select origin...</option>
                {branches.map(b => <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label>To Branch (Destination)</label>
              <select value={toBranch} onChange={e => setToBranch(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                <option value="">Select destination...</option>
                {branches.map(b => <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0' }}>Add Items</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label>Product Variant</label>
                <select value={selectedVariant} onChange={e => setSelectedVariant(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text)' }}>
                  <option value="">Select product to transfer...</option>
                  {products.map(p => <option key={p.variant_id} value={p.variant_id}>{p.product_name} ({p.sku})</option>)}
                </select>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label>Quantity</label>
                <input type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} style={{ padding: '10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text)' }} />
              </div>
              <button onClick={handleAddItem} style={{ padding: '10px 20px', background: 'var(--text-h)', color: 'var(--bg)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                Add to List
              </button>
            </div>

            {cart.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h4>Items to Transfer:</h4>
                <ul style={{ paddingLeft: '20px' }}>
                  {cart.map((item, i) => (
                    <li key={i}>{item.product_name} (SKU: {item.sku}) - Qty: {item.quantity}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button onClick={handleCreateTransfer} style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, width: '100%' }}>
            Initiate Transfer
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {transfers.map((t, i) => (
          <div key={i} style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {getBranchName(t.from_branch_id)} 
                <span style={{ color: 'var(--accent)' }}>➔</span> 
                {getBranchName(t.to_branch_id)}
                
                <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '12px', background: t.status === 'Completed' ? '#10b98122' : t.status === 'In-Transit' ? '#f59e0b22' : 'var(--bg)', color: t.status === 'Completed' ? '#10b981' : t.status === 'In-Transit' ? '#f59e0b' : 'var(--text-h)', border: '1px solid currentColor' }}>
                  {t.status}
                </span>
              </h3>
              <p style={{ margin: 0, opacity: 0.7, fontSize: '14px' }}>
                Transfer ID: {t.transfer_id.substring(0, 8)} | Date: {new Date(t.created_at).toLocaleDateString()} | Items: {t.items.length}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {t.status === 'Pending' && (
                <button onClick={() => handleAction(t.transfer_id, 'dispatch')} style={{ padding: '8px 16px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                  Dispatch (Ship)
                </button>
              )}
              {t.status === 'In-Transit' && (
                <button onClick={() => handleAction(t.transfer_id, 'receive')} style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                  Receive (Arrived)
                </button>
              )}
            </div>
          </div>
        ))}
        {transfers.length === 0 && <div style={{ opacity: 0.5, textAlign: 'center', padding: '40px' }}>No transfers found.</div>}
      </div>
    </div>
  );
};

export default Transfers;
