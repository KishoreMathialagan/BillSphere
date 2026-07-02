import { useEffect, useState } from 'react';
import api from '../../services/api';

const StockManagement = () => {
  const [stock, setStock] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const [adjustQty, setAdjustQty] = useState<{[key:string]: number}>({});
  const [reason, setReason] = useState<{[key:string]: string}>({});

  const fetchStock = async () => {
    try {
      const res = await api.get('/inventory/stock/details');
      setStock(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load stock');
    }
  };

  useEffect(() => {
    fetchStock();
    const interval = setInterval(fetchStock, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStock = async (item: any) => {
    try {
      const qty = Number(adjustQty[item.variant_id] || 0);

      if (qty === 0) {
        alert('Enter quantity');
        return;
      }

      await api.post('/inventory/adjust', {
        variant_id: item.variant_id,
        branch_id: 'MAIN',
        quantity_change: qty,
        reason: reason[item.variant_id] || 'Manual Adjustment'
      });

      alert('Stock Updated');

      fetchStock();

      setAdjustQty(prev => ({
        ...prev,
        [item.variant_id]: 0
      }));

    } catch (err) {
      console.error(err);
      alert('Failed to update stock');
    }
  };

  const filtered = stock.filter(item =>
    item.product_name?.toLowerCase().includes(search.toLowerCase()) ||
    item.barcode?.toLowerCase().includes(search.toLowerCase()) ||
    item.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '20px' }}>

      <h2>Inventory Management</h2>

      <input
        type="text"
        placeholder="Search product / barcode / sku"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '400px',
          padding: '10px',
          marginBottom: '20px'
        }}
      />

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse'
        }}
      >
        <thead>
          <tr>
            <th>Product</th>
            <th>Barcode</th>
            <th>SKU</th>
            <th>Current Stock</th>
            <th>Add / Remove</th>
            <th>Reason</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map(item => (
            <tr key={item.variant_id}>
              <td>{item.product_name}</td>

              <td>{item.barcode}</td>

              <td>{item.sku}</td>

              <td
                style={{
                  color:
                    item.quantity <= 5
                      ? 'red'
                      : 'green',
                  fontWeight: 'bold'
                }}
              >
                {item.quantity}
              </td>

              <td>
                <input
                  type="number"
                  value={
                    adjustQty[item.variant_id] || ''
                  }
                  onChange={e =>
                    setAdjustQty({
                      ...adjustQty,
                      [item.variant_id]:
                        Number(e.target.value)
                    })
                  }
                />
              </td>

              <td>
                <input
                  type="text"
                  placeholder="Purchase / Damage"
                  value={
                    reason[item.variant_id] || ''
                  }
                  onChange={e =>
                    setReason({
                      ...reason,
                      [item.variant_id]:
                        e.target.value
                    })
                  }
                />
              </td>

              <td>
                <button
                  onClick={() =>
                    updateStock(item)
                  }
                >
                  Update
                </button>
              </td>
            </tr>
          ))}

          {filtered.length === 0 && (
            <tr>
              <td colSpan={7}>
                No stock records found
              </td>
            </tr>
          )}
        </tbody>
      </table>

    </div>
  );
};

export default StockManagement;