import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface DashboardMetrics {
  total_sales: number;
  total_purchases: number;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  gst_collected: number;
  customer_count: number;
  vendor_count: number;
  outstanding_receivables: number;
  outstanding_payables: number;
  inventory_value: number;
  top_products: { name: string; amount: number }[];
  top_categories: { name: string; amount: number }[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  
  // Date Filters
  const [dateFilter, setDateFilter] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Calculate dates based on quick filter
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (dateFilter) {
      case 'today':
        start = new Date();
        end = new Date();
        break;
      case 'yesterday':
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
        break;
      case 'last7days':
        start.setDate(today.getDate() - 7);
        break;
      case 'last30days':
        start.setDate(today.getDate() - 30);
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'thisQuarter':
        const quarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), quarter * 3, 1);
        break;
      case 'thisFinancialYear':
        const isPastApril = today.getMonth() >= 3;
        const fyStartYear = isPastApril ? today.getFullYear() : today.getFullYear() - 1;
        start = new Date(fyStartYear, 3, 1); // April 1st
        break;
      case 'lastFinancialYear':
        const isPastAprilLast = today.getMonth() >= 3;
        const fyStartYearLast = isPastAprilLast ? today.getFullYear() - 1 : today.getFullYear() - 2;
        start = new Date(fyStartYearLast, 3, 1);
        end = new Date(fyStartYearLast + 1, 2, 31);
        break;
      case 'custom':
        // Do not auto-calculate, rely on explicit startDate and endDate
        return; 
    }

    if (dateFilter !== 'custom') {
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];
      setStartDate(startStr);
      setEndDate(endStr);
      fetchDashboardData(startStr, endStr);
    }
  }, [dateFilter]);

  const fetchDashboardData = async (start: string, end: string) => {
    if (!start || !end) return;
    try {
      setLoading(true);
      const res = await api.get(`/reports/dashboard?start_date=${start}&end_date=${end}`);
      setMetrics(res.data);
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDateFetch = () => {
    fetchDashboardData(startDate, endDate);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header and Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '28px', color: 'var(--text-h)' }}>Executive Dashboard</h2>
          <p style={{ margin: 0, opacity: 0.7 }}>Welcome back, {user?.sub?.split('@')[0] || 'User'}</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', background: 'var(--code-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>Date Range</label>
            <select 
              value={dateFilter} 
              onChange={e => setDateFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisQuarter">This Quarter</option>
              <option value="thisFinancialYear">This Financial Year</option>
              <option value="lastFinancialYear">Last Financial Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateFilter === 'custom' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Start</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>End</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              </div>
              <button 
                onClick={handleCustomDateFetch}
                style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--accent)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                Apply
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', opacity: 0.6 }}>Loading dashboard data...</div>
      ) : metrics ? (
        <>
          {/* Section 1: Financial Reports (Net Profit, Revenue, Expenses, GST) */}
          <h3 style={{ margin: '0 0 -12px', color: 'var(--text-h)' }}>Financial Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            {[
              { label: 'Net Profit', value: metrics.net_profit, isCurrency: true, icon: '💰', color: metrics.net_profit >= 0 ? '#10b981' : '#ef4444' },
              { label: 'Total Revenue', value: metrics.total_revenue, isCurrency: true, icon: '📈', color: 'var(--accent)' },
              { label: 'Total Expenses', value: metrics.total_expenses, isCurrency: true, icon: '📉', color: '#f59e0b' },
              { label: 'GST Collected', value: metrics.gst_collected, isCurrency: true, icon: '🧾', color: '#3b82f6' },
            ].map((stat, idx) => (
              <div key={idx} style={{ background: 'var(--code-bg)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.7, textTransform: 'uppercase' }}>{stat.label}</span>
                <h3 style={{ margin: '8px 0 0', fontSize: '28px', color: stat.color }}>
                  {stat.isCurrency ? '$' + stat.value.toFixed(2) : stat.value}
                </h3>
              </div>
            ))}
          </div>

          {/* Section 2: Sales & Purchases */}
          <h3 style={{ margin: '16px 0 -12px', color: 'var(--text-h)' }}>Sales & Purchases</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: 'var(--code-bg)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.7, textTransform: 'uppercase' }}>Gross Sales (Invoices)</span>
              <h3 style={{ margin: '8px 0 0', fontSize: '28px', color: '#10b981' }}>${metrics.total_sales.toFixed(2)}</h3>
              
              <h4 style={{ marginTop: '24px', fontSize: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Top Products by Sales</h4>
              {metrics.top_products.length > 0 ? metrics.top_products.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span>{p.name}</span>
                  <span style={{ fontWeight: 600 }}>${p.amount.toFixed(2)}</span>
                </div>
              )) : <div style={{ padding: '12px 0', opacity: 0.6 }}>No sales data for this period</div>}
            </div>

            <div style={{ background: 'var(--code-bg)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.7, textTransform: 'uppercase' }}>Total Purchases</span>
              <h3 style={{ margin: '8px 0 0', fontSize: '28px', color: '#f59e0b' }}>${metrics.total_purchases.toFixed(2)}</h3>
              
              <h4 style={{ marginTop: '24px', fontSize: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Top Categories by Sales</h4>
              {metrics.top_categories.length > 0 ? metrics.top_categories.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span>{c.name}</span>
                  <span style={{ fontWeight: 600 }}>${c.amount.toFixed(2)}</span>
                </div>
              )) : <div style={{ padding: '12px 0', opacity: 0.6 }}>No sales data for this period</div>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
            {/* Section 3: Customers & Vendors (Receivables/Payables) */}
            <div>
              <h3 style={{ margin: '0 0 16px', color: 'var(--text-h)' }}>Network & Balances</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: 'var(--code-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.7 }}>Customers (New)</span>
                  <h3 style={{ margin: '8px 0 0', fontSize: '24px', color: 'var(--text-h)' }}>{metrics.customer_count}</h3>
                </div>
                <div style={{ background: 'var(--code-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.7 }}>A/R (Total Outstanding)</span>
                  <h3 style={{ margin: '8px 0 0', fontSize: '24px', color: metrics.outstanding_receivables > 0 ? '#ef4444' : '#10b981' }}>
                    ${metrics.outstanding_receivables.toFixed(2)}
                  </h3>
                </div>
                <div style={{ background: 'var(--code-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.7 }}>Vendors (New)</span>
                  <h3 style={{ margin: '8px 0 0', fontSize: '24px', color: 'var(--text-h)' }}>{metrics.vendor_count}</h3>
                </div>
                <div style={{ background: 'var(--code-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.7 }}>A/P (Total Payable)</span>
                  <h3 style={{ margin: '8px 0 0', fontSize: '24px', color: metrics.outstanding_payables > 0 ? '#ef4444' : '#10b981' }}>
                    ${metrics.outstanding_payables.toFixed(2)}
                  </h3>
                </div>
              </div>
            </div>

            {/* Section 4: Inventory */}
            <div>
              <h3 style={{ margin: '0 0 16px', color: 'var(--text-h)' }}>Inventory Snapshot</h3>
              <div style={{ background: 'var(--code-bg)', borderRadius: '12px', padding: '32px', border: '1px solid var(--border)', height: 'calc(100% - 56px)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.7, textTransform: 'uppercase' }}>Total Asset Value (Cost)</span>
                <h3 style={{ margin: '8px 0 16px', fontSize: '36px', color: '#8b5cf6' }}>${metrics.inventory_value.toFixed(2)}</h3>
                <p style={{ opacity: 0.7, fontSize: '14px', lineHeight: '1.5' }}>
                  This represents the current total value of all your stock on hand across all branches, calculated using their recorded purchase price.
                </p>
                <Link to="/app/inventory" style={{ display: 'inline-block', marginTop: '16px', padding: '10px 16px', background: 'var(--accent)', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 600 }}>
                  Manage Inventory →
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : null}

    </div>
  );
};

export default Dashboard;
