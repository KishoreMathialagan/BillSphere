import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';

type TabType = 'health' | 'trends' | 'inventory' | 'revenue' | 'seasonal';

const Reports: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('this_month');
  const activeTab = (searchParams.get('tab') as TabType) || 'health';

  useEffect(() => { fetchData(); }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/dashboard?filter=${filter}`);
      setMetrics(res.data);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  const setTab = (tab: TabType) => setSearchParams({ tab });

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'health', label: 'Business Health', icon: '💚' },
    { id: 'trends', label: 'Trend Analysis', icon: '📈' },
    { id: 'inventory', label: 'Inventory Alerts', icon: '📦' },
    { id: 'revenue', label: 'Revenue', icon: '💰' },
    { id: 'seasonal', label: 'Seasonal AI', icon: '🌤️' },
  ];

  const filterOptions = [
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'this_year', label: 'This Year' },
  ];

  const scoreColor = (score: number) => {
    if (score >= 80) return '#16a34a';
    if (score >= 60) return '#d97706';
    return '#dc2626';
  };

  const scoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Needs Attention';
    return 'Critical';
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '32px' }}>📊</div>
      <div style={{ color: '#6b7280', fontSize: '16px' }}>Loading report data...</div>
    </div>
  );

  if (!metrics) return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Failed to load data. Check your connection.</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>Business Reports</h2>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>Detailed analysis from your AI dashboard</p>
        </div>

        {/* Period Filter */}
        <div style={{ display: 'flex', gap: '6px', background: '#f3f4f6', borderRadius: '10px', padding: '4px' }}>
          {filterOptions.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                background: filter === f.value ? '#004741' : 'transparent',
                color: filter === f.value ? 'white' : '#6b7280' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #f3f4f6', paddingBottom: '0' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
              color: activeTab === t.id ? '#004741' : '#6b7280',
              borderBottom: activeTab === t.id ? '2px solid #004741' : '2px solid transparent',
              marginBottom: '-2px', transition: 'all 0.15s' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── BUSINESS HEALTH TAB ── */}
      {activeTab === 'health' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Score Card */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <div style={{ fontSize: '72px', fontWeight: 800, color: scoreColor(metrics.health.score) }}>
                {metrics.health.score}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: scoreColor(metrics.health.score), background: `${scoreColor(metrics.health.score)}15`, padding: '4px 16px', borderRadius: '999px' }}>
                {scoreLabel(metrics.health.score)}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>Overall Business Health Score</div>
            </div>

            {/* Component Scores */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700 }}>Health Breakdown</h3>
              {Object.entries(metrics.health.components || {}).map(([key, val]: any) => (
                <div key={key} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'capitalize', color: '#374151' }}>
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: scoreColor(val) }}>{val}/100</span>
                  </div>
                  <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${val}%`, background: scoreColor(val), borderRadius: '999px', transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700 }}>🤖 AI Recommendations</h3>
            {metrics.recommendations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>✅ No issues found. Business is running well!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {metrics.recommendations.map((rec: any) => {
                  const priorityColor = rec.priority === 'HIGH' || rec.priority === 'CRITICAL' ? '#dc2626' : rec.priority === 'MEDIUM' ? '#d97706' : '#16a34a';
                  return (
                    <div key={rec.id} style={{ padding: '16px', background: `${priorityColor}08`, border: `1px solid ${priorityColor}30`, borderRadius: '12px', borderLeft: `4px solid ${priorityColor}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{rec.type}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: priorityColor }}>{rec.priority}</span>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>{rec.title}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>{rec.description}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TREND ANALYSIS TAB ── */}
      {activeTab === 'trends' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Top Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { label: 'Top Product', value: metrics.trends.top_product || 'N/A', icon: '🏆', color: '#7c3aed' },
              { label: 'Top Category', value: metrics.trends.top_category || 'N/A', icon: '📁', color: '#1a5fa8' },
              { label: 'Sales Interval', value: metrics.trends.sales_series?.interval || 'Daily', icon: '📅', color: '#16a34a' },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{s.icon}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, marginBottom: '4px' }}>{s.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Sales Chart */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>📈 Sales Trend</h3>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                {metrics.trends.sales_series?.start_date} → {metrics.trends.sales_series?.end_date}
              </div>
            </div>

            {metrics.trends.sales_series?.points?.length > 0 ? (() => {
              const points = metrics.trends.sales_series.points;
              const maxVal = Math.max(...points.map((p: any) => p.sales), 1);
              return (
                <div>
                  {/* Bar Chart */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '200px', marginBottom: '8px' }}>
                    {points.map((pt: any, i: number) => (
                      <div key={i} title={`${pt.date}: ₹${pt.sales}`}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '4px' }}>
                        <div style={{ fontSize: '10px', color: '#9ca3af' }}>₹{pt.sales > 999 ? `${(pt.sales/1000).toFixed(1)}k` : pt.sales}</div>
                        <div style={{ width: '100%', background: '#004741', borderRadius: '4px 4px 0 0', height: `${(pt.sales / maxVal) * 160}px`, minHeight: pt.sales > 0 ? '4px' : '0', opacity: 0.8 }} />
                      </div>
                    ))}
                  </div>
                  {/* X-axis labels */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {points.map((pt: any, i: number) => (
                      <div key={i} style={{ flex: 1, fontSize: '10px', color: '#9ca3af', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pt.date?.slice(5)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })() : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No sales data for this period</div>
            )}
          </div>

          {/* Daily Summary Table */}
          {metrics.trends.sales_series?.points?.length > 0 && (
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Daily Breakdown</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>Sales</th>
                    <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>vs Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const points = metrics.trends.sales_series.points;
                    const avg = points.reduce((s: number, p: any) => s + p.sales, 0) / points.length;
                    return points.map((pt: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                        <td style={{ padding: '12px 24px', fontSize: '14px', color: '#374151' }}>{pt.date}</td>
                        <td style={{ padding: '12px 24px', textAlign: 'right', fontSize: '14px', fontWeight: 700, color: '#004741' }}>₹{pt.sales.toLocaleString()}</td>
                        <td style={{ padding: '12px 24px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: pt.sales >= avg ? '#16a34a' : '#dc2626' }}>
                          {pt.sales >= avg ? '▲' : '▼'} {Math.abs(((pt.sales - avg) / avg) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── INVENTORY ALERTS TAB ── */}
      {activeTab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { label: 'Out of Stock', value: metrics.inventory.out_of_stock_count, color: '#dc2626', icon: '🚫', bg: '#fef2f2' },
              { label: 'Critical (≤5)', value: metrics.inventory.critical_stock_count, color: '#d97706', icon: '⚠️', bg: '#fffbeb' },
              { label: 'Low Stock', value: metrics.inventory.low_stock_count, color: '#2563eb', icon: '📉', bg: '#eff6ff' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: '16px', padding: '24px', border: `1px solid ${s.color}30` }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Inventory Recommendations from AI */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700 }}>🤖 AI Inventory Insights</h3>
            {metrics.recommendations.filter((r: any) => r.type === 'INVENTORY_ALERT' || r.type === 'INVENTORY').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>✅ No inventory issues detected</div>
            ) : (
              metrics.recommendations
                .filter((r: any) => r.type === 'INVENTORY_ALERT' || r.type === 'INVENTORY')
                .map((rec: any) => (
                  <div key={rec.id} style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', marginBottom: '12px', borderLeft: '4px solid #dc2626' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>{rec.title}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>{rec.description}</div>
                  </div>
                ))
            )}
            <div style={{ marginTop: '16px', padding: '16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>💡 Tip: Go to Stock & Alerts to restock items</div>
            </div>
          </div>
        </div>
      )}

      {/* ── REVENUE TAB ── */}
      {activeTab === 'revenue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Revenue Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {[
              { label: 'Current Period Revenue', value: `₹${metrics.revenue.current_revenue.value.toLocaleString()}`, trend: metrics.revenue.current_revenue.trend, change: metrics.revenue.current_revenue.change, color: '#004741' },
              { label: 'Previous Period Revenue', value: `₹${metrics.revenue.previous_revenue.value.toLocaleString()}`, trend: metrics.revenue.previous_revenue.trend, change: metrics.revenue.previous_revenue.change, color: '#6b7280' },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 600, marginBottom: '8px' }}>{s.label}</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: s.color, marginBottom: '12px' }}>{s.value}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: s.trend === 'up' ? '#16a34a' : '#dc2626' }}>
                  {s.trend === 'up' ? '▲' : '▼'} {s.change.toFixed(1)}% vs previous
                </div>
              </div>
            ))}
          </div>

          {/* Invoice Stats */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700 }}>🧾 Invoice Statistics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {[
                { label: 'Total Invoices', value: metrics.invoices.count.value, unit: 'invoices' },
                { label: 'Average Invoice Value', value: `₹${metrics.invoices.average_amount.value.toLocaleString()}`, unit: '' },
                { label: 'Highest Invoice', value: `₹${metrics.invoices.highest_amount?.toLocaleString() || 0}`, unit: '' },
                { label: 'Lowest Invoice', value: `₹${metrics.invoices.lowest_amount?.toLocaleString() || 0}`, unit: '' },
              ].map(s => (
                <div key={s.label} style={{ padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, marginBottom: '6px' }}>{s.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#004741' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Recommendations */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700 }}>🤖 Revenue AI Insights</h3>
            {metrics.recommendations
              .filter((r: any) => !r.type?.includes('INVENTORY'))
              .length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>✅ Revenue looks healthy!</div>
            ) : (
              metrics.recommendations
                .filter((r: any) => !r.type?.includes('INVENTORY'))
                .map((rec: any) => {
                  const color = rec.priority === 'HIGH' || rec.priority === 'CRITICAL' ? '#dc2626' : rec.priority === 'MEDIUM' ? '#d97706' : '#16a34a';
                  return (
                    <div key={rec.id} style={{ padding: '16px', background: `${color}08`, border: `1px solid ${color}30`, borderRadius: '12px', marginBottom: '10px', borderLeft: `4px solid ${color}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280' }}>{rec.type}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color }}>{rec.priority}</span>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>{rec.title}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>{rec.description}</div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}
      {/* ── SEASONAL AI TAB ── */}
      {activeTab === 'seasonal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Current Season Banner */}
          {(() => {
            const seasonal = metrics.recommendations.filter((r: any) => r.type === 'SEASONAL INSIGHT');
            const forward = metrics.recommendations.filter((r: any) => r.type === 'FORWARD PLANNING');
            const festivals = metrics.recommendations.filter((r: any) => r.type === 'FESTIVAL ALERT');

            return (
              <>
                {/* Season Card */}
                {seasonal.map((rec: any) => (
                  <div key={rec.id} style={{ background: 'linear-gradient(135deg, #004741, #16a34a)', borderRadius: '16px', padding: '28px', color: 'white' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, opacity: 0.7, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Current Season</div>
                    <h3 style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: 800 }}>{rec.title}</h3>
                    <p style={{ margin: 0, opacity: 0.9, lineHeight: 1.6, fontSize: '14px', whiteSpace: 'pre-line' }}>{rec.description}</p>
                  </div>
                ))}

                {/* Festival Alerts */}
                {festivals.length > 0 && (
                  <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e5e7eb' }}>
                    <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700 }}>🎊 Upcoming Festival Alerts</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {festivals.map((rec: any) => {
                        const color = rec.priority === 'CRITICAL' ? '#dc2626' : rec.priority === 'HIGH' ? '#d97706' : rec.priority === 'MEDIUM' ? '#2563eb' : '#16a34a';
                        return (
                          <div key={rec.id} style={{ padding: '16px', background: `${color}08`, border: `1px solid ${color}30`, borderRadius: '12px', borderLeft: `4px solid ${color}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Festival Alert</span>
                              <span style={{ fontSize: '12px', fontWeight: 700, color, background: `${color}15`, padding: '2px 8px', borderRadius: '999px' }}>{rec.priority}</span>
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>{rec.title}</div>
                            <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{rec.description}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {festivals.length === 0 && (
                  <div style={{ background: 'white', borderRadius: '16px', padding: '32px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#9ca3af' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📅</div>
                    <div style={{ fontSize: '15px', fontWeight: 600 }}>No major festivals in the next 30 days</div>
                    <div style={{ fontSize: '13px', marginTop: '4px' }}>Check back closer to festival season</div>
                  </div>
                )}

                {/* Next Month Preview */}
                {forward.map((rec: any) => (
                  <div key={rec.id} style={{ background: '#f0f7ff', borderRadius: '16px', padding: '24px', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Forward Planning</div>
                    <h3 style={{ margin: '0 0 10px', fontSize: '17px', fontWeight: 700, color: '#1e3a5f' }}>{rec.title}</h3>
                    <p style={{ margin: 0, color: '#374151', fontSize: '14px', lineHeight: 1.6 }}>{rec.description}</p>
                  </div>
                ))}

                {/* Full Year Calendar */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700 }}>📅 Indian Supermarket Season Calendar</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {[
                      { month: 'January', icon: '❄️', items: 'Dry Fruits, Jaggery, Pongal items' },
                      { month: 'February', icon: '🌸', items: 'Strawberries, Gift packs, Chocolates' },
                      { month: 'March', icon: '🎨', items: 'Holi colours, Cold drinks, Mangoes' },
                      { month: 'April', icon: '☀️', items: 'Mangoes, Ice cream, Tamil New Year sweets' },
                      { month: 'May', icon: '🥭', items: 'Peak mangoes, Watermelon, Juices' },
                      { month: 'June', icon: '🌧️', items: 'Ginger, Hot snacks, Immunity boosters' },
                      { month: 'July', icon: '🌂', items: 'Instant noodles, Corn, Hot beverages' },
                      { month: 'August', icon: '🪔', items: 'Modak, Onam flowers, Raksha Bandhan sweets' },
                      { month: 'September', icon: '🙏', items: 'Navratri fasting foods, Sabudana' },
                      { month: 'October', icon: '🎆', items: 'DIWALI — Sweets, Dry fruits, Gift boxes' },
                      { month: 'November', icon: '🥬', items: 'Winter vegetables, Hot beverages' },
                      { month: 'December', icon: '🎂', items: 'Cakes, Plum cake, Christmas gifts' },
                    ].map(m => {
                      const isCurrentMonth = new Date().toLocaleString('en', { month: 'long' }) === m.month;
                      return (
                        <div key={m.month} style={{ padding: '14px', borderRadius: '10px', border: isCurrentMonth ? '2px solid #004741' : '1px solid #f3f4f6', background: isCurrentMonth ? '#f0fdf4' : '#fafafa' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '18px' }}>{m.icon}</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: isCurrentMonth ? '#004741' : '#374151' }}>
                              {m.month} {isCurrentMonth && '← Now'}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.4 }}>{m.items}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

    </div>
  );
};

export default Reports;

// NOTE: Add this tab to the tabs array in Reports.tsx:
// { id: 'seasonal', label: 'Seasonal', icon: '🌿' }
// And add this route to App.tsx seasonal tab handler