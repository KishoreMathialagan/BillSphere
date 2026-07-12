import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { NeuoCard } from '../components/molecules/NeuoCard';
import { GlassCard } from '../components/molecules/GlassCard';

interface BaseKPI {
  value: number;
  change: number;
  trend: string;
  last_updated: string;
}

interface RevenueMetrics {
  current_revenue: BaseKPI;
  previous_revenue: BaseKPI;
}

interface InvoiceMetrics {
  count: BaseKPI;
  average_amount: BaseKPI;
  highest_amount: number;
  lowest_amount: number;
}

interface InventoryMetrics {
  low_stock_count: number;
  critical_stock_count: number;
  out_of_stock_count: number;
}

interface HealthMetrics {
  score: number;
  status: string;
  components: Record<string, number>;
}

interface SalesTrendPoint {
  date: string;
  sales: number;
}

interface SalesSeries {
  interval: string;
  start_date: string;
  end_date: string;
  points: SalesTrendPoint[];
}

interface TrendMetrics {
  sales_series: SalesSeries;
  top_product: string;
  top_category: string;
}

interface RecommendationNavigation {
  route: string;
  params: Record<string, any>;
  query: string;
}

interface DashboardRecommendation {
  id: number;
  type: string;
  priority: string;
  title: string;
  description: string;
  navigation: RecommendationNavigation;
  created_at: string;
}

interface DashboardMetricsResponse {
  revenue: RevenueMetrics;
  invoices: InvoiceMetrics;
  inventory: InventoryMetrics;
  health: HealthMetrics;
  trends: TrendMetrics;
  recommendations: DashboardRecommendation[];
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData('this_month');
  }, []);

  const fetchDashboardData = async (filter: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/dashboard?filter=${filter}`);
      setMetrics(res.data);
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationClick = (nav: RecommendationNavigation) => {
    navigate(`${nav.route}${nav.query}`);
  };

  // Helper for trend icons
  const renderTrend = (trend: string, change: number) => {
    if (trend === 'up') return <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>▲ +{change.toFixed(1)}%</span>;
    if (trend === 'down') return <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>▼ {change.toFixed(1)}%</span>;
    return <span style={{ color: 'var(--color-night-40)', fontWeight: 600 }}>— 0%</span>;
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'CRITICAL') return 'var(--color-warning)';
    if (priority === 'HIGH') return 'var(--color-warning)'; // For now use warning color for high
    if (priority === 'MEDIUM') return 'var(--color-night-60)';
    return 'var(--color-success)'; // INFO/LOW
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* Top Row: KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-6)' }}>
        
        {/* REVENUE CARD */}
        <NeuoCard>
          <div className="data-label" style={{ color: 'var(--color-night-60)', marginBottom: 'var(--space-2)' }}>Revenue</div>
          <div className="metric-lg" style={{ color: 'var(--color-cyprus)' }}>
            {loading ? <span className="skeleton" style={{ width: '120px', height: '40px', display: 'inline-block' }}></span> : `₹${metrics?.revenue.current_revenue.value.toLocaleString()}`}
          </div>
          <div className="body-sm" style={{ color: 'var(--color-night-60)', marginTop: 'var(--space-1)' }}>This Period</div>
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {!loading && metrics && (
              <>
                <span className="data-number">{renderTrend(metrics.revenue.current_revenue.trend, metrics.revenue.current_revenue.change)}</span>
                <span className="body-sm" style={{ color: 'var(--color-night-40)' }}>vs previous period</span>
              </>
            )}
            {loading && <span className="skeleton" style={{ width: '80px', height: '16px', display: 'inline-block' }}></span>}
          </div>
        </NeuoCard>

        {/* INVOICES CARD */}
        <NeuoCard>
          <div className="data-label" style={{ color: 'var(--color-night-60)', marginBottom: 'var(--space-2)' }}>Invoices</div>
          <div className="metric-lg" style={{ color: 'var(--color-night)' }}>
            {loading ? <span className="skeleton" style={{ width: '80px', height: '40px', display: 'inline-block' }}></span> : metrics?.invoices.count.value}
          </div>
          <div className="body-sm" style={{ color: 'var(--color-night-60)', marginTop: 'var(--space-1)' }}>Issued in Period</div>
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {loading ? <span className="skeleton" style={{ width: '80px', height: '16px', display: 'inline-block' }}></span> : (
              <span className="data-number" style={{ color: 'var(--color-night-40)' }}>Avg ₹{metrics?.invoices.average_amount.value.toLocaleString()}</span>
            )}
          </div>
        </NeuoCard>

        {/* INVENTORY CARD */}
        <NeuoCard>
          <div className="data-label" style={{ color: 'var(--color-night-60)', marginBottom: 'var(--space-2)' }}>Stock Alerts</div>
          <div className="metric-lg" style={{ color: 'var(--color-warning)' }}>
            {loading ? <span className="skeleton" style={{ width: '60px', height: '40px', display: 'inline-block' }}></span> : (
              (metrics?.inventory.out_of_stock_count || 0) + (metrics?.inventory.critical_stock_count || 0) + (metrics?.inventory.low_stock_count || 0)
            )}
          </div>
          <div className="body-sm" style={{ color: 'var(--color-night-60)', marginTop: 'var(--space-1)' }}>Total items below par</div>
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--color-night-60)' }}>
            {!loading && metrics && (
              <>
                <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>{metrics.inventory.out_of_stock_count} Out</span>
                <span>•</span>
                <span style={{ color: 'var(--color-night)', fontWeight: 600 }}>{metrics.inventory.critical_stock_count} Crit</span>
                <span>•</span>
                <span>{metrics.inventory.low_stock_count} Low</span>
              </>
            )}
          </div>
        </NeuoCard>

        {/* AI INSIGHTS CARD */}
        <NeuoCard>
          <div className="data-label" style={{ color: 'var(--color-night-60)', marginBottom: 'var(--space-2)' }}>AI Insights</div>
          <div className="metric-lg" style={{ color: 'var(--color-cyprus)' }}>
            {loading ? <span className="skeleton" style={{ width: '60px', height: '40px', display: 'inline-block' }}></span> : metrics?.recommendations.length}
          </div>
          <div className="body-sm" style={{ color: 'var(--color-night-60)', marginTop: 'var(--space-1)' }}>Generated Recommendations</div>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <span className="body-sm" style={{ fontWeight: 600 }}>See actionable alerts below ↓</span>
          </div>
        </NeuoCard>
      </div>

      {/* Middle Section: Chart & Cyprus Halo */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
        
        {/* Sales Chart Area */}
        <NeuoCard style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
            <h2 className="heading-3" style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Sales Overview</h2>
            <div className="body-sm" style={{ color: 'var(--color-night-60)' }}>This Period</div>
          </div>
          <div style={{ flexGrow: 1, minHeight: '260px', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '16px', position: 'relative' }}>
            {loading && <div style={{width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>Loading Trend Data...</div>}
            {!loading && metrics && metrics.trends.sales_series.points.length > 0 && (() => {
                const maxSales = Math.max(...metrics.trends.sales_series.points.map(p => p.sales), 1);
                return metrics.trends.sales_series.points.map((pt, i) => {
                  const heightPct = (pt.sales / maxSales) * 100;
                  return (
                    <div key={i} title={`${pt.date}: ₹${pt.sales}`} style={{ flex: 1, background: 'var(--color-cyprus-tint)', borderRadius: '4px 4px 0 0', position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                      <div style={{ width: '100%', height: `${heightPct}%`, background: 'var(--color-cyprus)', borderRadius: '4px 4px 0 0', opacity: 0.8, transition: 'height 1s var(--ease-spring)' }}></div>
                    </div>
                  );
                });
            })()}
            {!loading && metrics && metrics.trends.sales_series.points.length === 0 && (
                <div style={{width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-night-60)'}}>No sales data in this period.</div>
            )}
          </div>
        </NeuoCard>

        {/* Cyprus Halo Area (Business Health) */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 'var(--space-8) 0' }}>
          <div className="cyprus-halo-ring">
            <div className="cyprus-halo-inner">
              <div className="body-sm" style={{ color: 'rgba(240, 237, 228, 0.70)' }}>Business Health</div>
              <div className="display-text" style={{ color: 'var(--color-sand)', marginTop: '-8px' }}>
                {loading ? '--' : metrics?.health.score}
              </div>
              {!loading && metrics && (
                  <div className="body-sm" style={{ color: 'rgba(240, 237, 228, 0.70)', marginTop: '4px' }}>{metrics.health.status}</div>
              )}
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
          
          {loading && <div style={{ color: 'var(--color-sand)' }}>Loading AI Insights...</div>}
          
          {!loading && metrics && metrics.recommendations.map(rec => (
            <div key={rec.id} onClick={() => handleRecommendationClick(rec.navigation)} style={{ cursor: 'pointer', textDecoration: 'none' }}>
              <GlassCard variant="dark" style={{ minWidth: '320px', padding: 'var(--space-4)', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <div className="data-label" style={{ color: 'var(--color-sand)', opacity: 0.7 }}>{rec.type}</div>
                  <div className="data-label" style={{ color: getPriorityColor(rec.priority) }}>{rec.priority}</div>
                </div>
                <h4 style={{ color: 'var(--color-sand)', margin: '0 0 8px 0', fontSize: '14px' }}>{rec.title}</h4>
                <div className="body" style={{ color: 'var(--color-sand)', fontSize: '13px', opacity: 0.9 }}>{rec.description}</div>
              </GlassCard>
            </div>
          ))}

          {!loading && metrics && metrics.recommendations.length === 0 && (
             <div style={{ color: 'var(--color-sand)' }}>No pending recommendations. You're doing great!</div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default Dashboard;
