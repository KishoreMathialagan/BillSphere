import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

interface SalesData {
  date: string;
  actual?: number;
  forecast?: number;
}

interface InventoryForecast {
  variant_id: string;
  product_name: string;
  sku: string;
  current_stock: number;
  daily_velocity: number;
  projected_30d_demand: number;
  days_remaining: number;
  status: string;
}

const ForecastingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory'>('sales');
  
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [avgDaily, setAvgDaily] = useState(0);
  
  const [inventoryData, setInventoryData] = useState<InventoryForecast[]>([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const salesRes = await api.get('/forecasting/sales');
      const hist = salesRes.data.historical;
      const fcast = salesRes.data.forecast;
      
      // Combine them into a single timeline
      const combined = [...hist, ...fcast];
      setSalesData(combined);
      setAvgDaily(salesRes.data.avg_daily_sales);
      
      const invRes = await api.get('/forecasting/inventory-demand');
      setInventoryData(invRes.data);
      
    } catch (err) {
      console.error('Failed to load forecasting data', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critical': return '#ef4444';
      case 'Warning': return '#f59e0b';
      case 'Healthy': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Analyzing historical data and running projections...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--text-h)' }}>Forecasting & Projections</h1>
          <p style={{ opacity: 0.7, margin: '8px 0 0' }}>Statistical time-series analysis for sales and inventory</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <button 
          onClick={() => setActiveTab('sales')}
          style={{ 
            padding: '12px 24px', background: 'transparent', border: 'none', 
            borderBottom: activeTab === 'sales' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'sales' ? 'var(--accent)' : 'var(--text)',
            fontWeight: 600, cursor: 'pointer', fontSize: '15px'
          }}
        >
          📈 Sales Forecast
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          style={{ 
            padding: '12px 24px', background: 'transparent', border: 'none', 
            borderBottom: activeTab === 'inventory' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'inventory' ? 'var(--accent)' : 'var(--text)',
            fontWeight: 600, cursor: 'pointer', fontSize: '15px'
          }}
        >
          📦 Demand & Inventory
        </button>
      </div>

      {activeTab === 'sales' && (
        <div style={{ background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', color: 'var(--text-h)' }}>30-Day Sales Projection</h3>
          <p style={{ fontSize: '14px', opacity: 0.7, marginBottom: '24px' }}>
            Based on a 90-day moving average velocity of <strong>${avgDaily.toFixed(2)} / day</strong>.
          </p>
          
          <div style={{ width: '100%', height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="actual" name="Actual Sales" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="forecast" name="Projected Sales" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', color: 'var(--text-h)' }}>Top Demanded Products (Next 30 Days)</h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryData.slice(0, 10)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="product_name" tick={{fontSize: 12}} />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="projected_30d_demand" name="Projected 30-Day Demand (Units)" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <h3 style={{ margin: '24px 24px 16px', color: 'var(--text-h)' }}>Stockout Predictions (Days Remaining)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'var(--code-bg)' }}>
                <tr>
                  <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Product</th>
                  <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Current Stock</th>
                  <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Daily Velocity</th>
                  <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Proj. 30d Demand</th>
                  <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Days Remaining</th>
                  <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>{item.sku}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>{item.current_stock}</td>
                    <td style={{ padding: '16px 24px' }}>{item.daily_velocity} / day</td>
                    <td style={{ padding: '16px 24px' }}>{item.projected_30d_demand}</td>
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>
                      {item.days_remaining === -1 ? 'Infinite (No Sales)' : item.days_remaining}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                        background: `${getStatusColor(item.status)}20`,
                        color: getStatusColor(item.status)
                      }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {inventoryData.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px', textAlign: 'center', opacity: 0.5 }}>
                      Not enough data to run inventory forecasts.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastingDashboard;
