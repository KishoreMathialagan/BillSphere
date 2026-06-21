import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { NeuoCard } from '../components/molecules/NeuoCard';
import { GlassCard } from '../components/molecules/GlassCard';

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
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  // Simplified to this month for the UI mock
  useEffect(() => {
    const today = new Date();
    const startStr = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const endStr = new Date().toISOString().split('T')[0];
    fetchDashboardData(startStr, endStr);
  }, []);

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

  // Mock Health Score for UI presentation as per design system
  const healthScore = metrics ? 87 : '--';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* Top Row: KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-6)' }}>
        <NeuoCard>
          <div className="data-label" style={{ color: 'var(--color-night-60)', marginBottom: 'var(--space-2)' }}>Revenue</div>
          <div className="metric-lg" style={{ color: 'var(--color-cyprus)' }}>
            {loading ? <span className="skeleton" style={{ width: '120px', height: '40px', display: 'inline-block' }}></span> : `₹${metrics?.total_revenue.toLocaleString()}`}
          </div>
          <div className="body-sm" style={{ color: 'var(--color-night-60)', marginTop: 'var(--space-1)' }}>Today's Revenue</div>
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span className="data-number" style={{ color: 'var(--color-success)', fontWeight: 600 }}>▲ +12.4%</span>
            <span className="body-sm" style={{ color: 'var(--color-night-40)' }}>vs yesterday</span>
          </div>
        </NeuoCard>

        <NeuoCard>
          <div className="data-label" style={{ color: 'var(--color-night-60)', marginBottom: 'var(--space-2)' }}>Invoices</div>
          <div className="metric-lg" style={{ color: 'var(--color-night)' }}>
            {loading ? <span className="skeleton" style={{ width: '80px', height: '40px', display: 'inline-block' }}></span> : 143}
          </div>
          <div className="body-sm" style={{ color: 'var(--color-night-60)', marginTop: 'var(--space-1)' }}>Issued Today</div>
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span className="data-number" style={{ color: 'var(--color-night-40)' }}>Avg ₹1,240</span>
          </div>
        </NeuoCard>

        <NeuoCard>
          <div className="data-label" style={{ color: 'var(--color-night-60)', marginBottom: 'var(--space-2)' }}>Stock Alerts</div>
          <div className="metric-lg" style={{ color: 'var(--color-warning)' }}>
            {loading ? <span className="skeleton" style={{ width: '60px', height: '40px', display: 'inline-block' }}></span> : 18}
          </div>
          <div className="body-sm" style={{ color: 'var(--color-night-60)', marginTop: 'var(--space-1)' }}>Items below par</div>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Link to="/app/inventory" className="body-sm" style={{ fontWeight: 600 }}>View Alerts →</Link>
          </div>
        </NeuoCard>

        <NeuoCard>
          <div className="data-label" style={{ color: 'var(--color-night-60)', marginBottom: 'var(--space-2)' }}>AI Insights</div>
          <div className="metric-lg" style={{ color: 'var(--color-cyprus)' }}>
            {loading ? <span className="skeleton" style={{ width: '60px', height: '40px', display: 'inline-block' }}></span> : 3}
          </div>
          <div className="body-sm" style={{ color: 'var(--color-night-60)', marginTop: 'var(--space-1)' }}>New recommendations</div>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Link to="/app/assistant" className="body-sm" style={{ fontWeight: 600 }}>Read Insights →</Link>
          </div>
        </NeuoCard>
      </div>

      {/* Middle Section: Chart & Cyprus Halo */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
        
        {/* Sales Chart Area */}
        <NeuoCard style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
            <h2 className="heading-3" style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Sales Overview</h2>
            <div className="body-sm" style={{ color: 'var(--color-night-60)' }}>This Month</div>
          </div>
          <div style={{ flexGrow: 1, minHeight: '260px', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '16px', position: 'relative' }}>
            {/* Pseudo-chart for UI visualization */}
            {[40, 60, 45, 80, 50, 90, 75].map((height, i) => (
              <div key={i} style={{ flex: 1, background: 'var(--color-cyprus-tint)', borderRadius: '4px 4px 0 0', position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ width: '100%', height: `${height}%`, background: 'var(--color-cyprus)', borderRadius: '4px 4px 0 0', opacity: i === 6 ? 1 : 0.6, transition: 'height 1s var(--ease-spring)' }}></div>
              </div>
            ))}
          </div>
        </NeuoCard>

        {/* Cyprus Halo Area */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 'var(--space-8) 0' }}>
          <div className="cyprus-halo-ring">
            <div className="cyprus-halo-inner">
              <div className="body-sm" style={{ color: 'rgba(240, 237, 228, 0.70)' }}>Business Health</div>
              <div className="display-text" style={{ color: 'var(--color-sand)', marginTop: '-8px' }}>
                {loading ? '--' : healthScore}
              </div>
            </div>
          </div>
          <style>{`
            .cyprus-halo-ring {
              width: 280px;
              height: 280px;
              border-radius: 50%;
              background: var(--color-sand);
              box-shadow: 12px 12px 28px var(--color-sand-shadow), -12px -12px 28px #FFFFFF;
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              animation: halo-pulse 3s ease-in-out infinite;
            }
            .cyprus-halo-ring::before {
              content: '';
              position: absolute;
              inset: 8px;
              border-radius: 50%;
              border: 1.5px dashed rgba(0, 71, 65, 0.35);
              animation: halo-spin 40s linear infinite;
            }
            .cyprus-halo-ring::after {
              content: '';
              position: absolute;
              inset: 20px;
              border-radius: 50%;
              border: 1px solid rgba(0, 71, 65, 0.12);
            }
            .cyprus-halo-inner {
              width: 200px;
              height: 200px;
              border-radius: 50%;
              background: rgba(0, 71, 65, 0.14);
              backdrop-filter: blur(20px) saturate(160%);
              border: 1px solid rgba(240, 237, 228, 0.28);
              box-shadow: inset 0 1px 0 rgba(240,237,228,0.20), 0 8px 32px rgba(0,0,0,0.18);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              z-index: 2;
            }
          `}</style>
        </div>

      </div>

      {/* Bottom Section: AI Recommendations */}
      <div style={{ marginTop: 'var(--space-2)' }}>
        <div style={{ background: 'var(--color-cyprus-deep)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', display: 'flex', gap: 'var(--space-6)', overflowX: 'auto', alignItems: 'center' }}>
          <div style={{ paddingRight: 'var(--space-4)', borderRight: '1px solid rgba(240,237,228,0.2)' }}>
            <div className="display-sm-text" style={{ color: 'var(--color-sand)' }}>AI</div>
          </div>
          
          <GlassCard variant="dark" style={{ minWidth: '320px', padding: 'var(--space-4)' }}>
            <div className="data-label" style={{ color: 'var(--color-sand)', opacity: 0.7, marginBottom: 'var(--space-2)' }}>INVENTORY ALERT</div>
            <div className="body" style={{ color: 'var(--color-sand)' }}>Milk inventory will run out in 3 days. Recommend ordering 50 liters.</div>
          </GlassCard>

          <GlassCard variant="dark" style={{ minWidth: '320px', padding: 'var(--space-4)' }}>
            <div className="data-label" style={{ color: 'var(--color-sand)', opacity: 0.7, marginBottom: 'var(--space-2)' }}>TREND ANALYSIS</div>
            <div className="body" style={{ color: 'var(--color-sand)' }}>Rice category up 22% this week. Expect continued demand due to upcoming festival.</div>
          </GlassCard>
        </div>
      </div>
      
    </div>
  );
};

export default Dashboard;
