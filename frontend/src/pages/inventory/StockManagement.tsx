import { useState, useEffect } from 'react';
import api from '../../services/api';

const StockManagement = () => {
  const [stock, setStock] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    api.get('/inventory/stock').then(res => setStock(res.data));
    api.get('/inventory/alerts').then(res => setAlerts(res.data));
  }, []);

  return (
    <div>
      <h2>Stock Management</h2>
      
      <div style={{border: '1px solid red', padding: '10px', marginBottom: '20px', width: '500px'}}>
        <h3 style={{color: 'red', marginTop: 0}}>Low Stock Alerts</h3>
        <ul>
          {alerts.map((a: any) => (
            <li key={a.inventory_id}>Variant ID: {a.variant_id} - Qty: {a.quantity}</li>
          ))}
          {alerts.length === 0 && <li>No low stock items.</li>}
        </ul>
      </div>

      <h3>Current Stock</h3>
      <ul>
        {stock.map((s: any) => (
          <li key={s.inventory_id}>Variant ID: {s.variant_id} - Qty: {s.quantity}</li>
        ))}
        {stock.length === 0 && <li>No stock entries found.</li>}
      </ul>
    </div>
  );
};
export default StockManagement;
