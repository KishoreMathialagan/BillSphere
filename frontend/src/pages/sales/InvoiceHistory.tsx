import { useEffect, useState } from 'react';
import api from '../../services/api';

type FilterPeriod = 'today' | 'week' | 'month' | 'year' | 'all';

const InvoiceHistory = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [period, setPeriod] = useState<FilterPeriod>('today');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [invoices, period, search]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales/invoices/detailed');
      setInvoices(res.data);
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    const now = new Date();
    let result = [...invoices];

    // Period filter
    result = result.filter(inv => {
      const created = new Date(inv.created_at);
      if (period === 'today') {
        return created.toDateString() === now.toDateString();
      } else if (period === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return created >= weekAgo;
      } else if (period === 'month') {
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      } else if (period === 'year') {
        return created.getFullYear() === now.getFullYear();
      }
      return true;
    });

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(inv =>
        inv.invoice_number?.toLowerCase().includes(q) ||
        inv.customer_name?.toLowerCase().includes(q) ||
        inv.items?.some((item: any) => item.product_name?.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setFiltered(result);
  };

  // Summary stats
  const totalSales = filtered.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
  const totalTax = filtered.reduce((sum, inv) => sum + Number(inv.total_tax || 0), 0);
  const totalInvoices = filtered.length;

  const formatDate = (dt: string) => {
    const d = new Date(dt);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const periodLabels: Record<FilterPeriod, string> = {
    today: 'Today', week: 'This Week', month: 'This Month', year: 'This Year', all: 'All Time'
  };

  const statusColor = (status: string) => {
    if (status === 'Paid') return '#16a34a';
    if (status === 'Partial') return '#d97706';
    return '#dc2626';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>Invoice History</h2>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>All sales transactions with full details</p>
        </div>
        <button onClick={fetchInvoices} style={{ padding: '8px 16px', background: '#1a5fa8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
          🔄 Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {[
          { label: 'Total Invoices', value: totalInvoices, color: '#1a5fa8', icon: '🧾' },
          { label: 'Total Sales', value: `₹${totalSales.toFixed(2)}`, color: '#16a34a', icon: '💰' },
          { label: 'Total GST Collected', value: `₹${totalTax.toFixed(2)}`, color: '#7c3aed', icon: '📊' },
        ].map(card => (
          <div key={card.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{card.icon}</div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>{card.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: card.color, marginTop: '4px' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Period Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: '#f3f4f6', borderRadius: '10px', padding: '4px' }}>
          {(Object.keys(periodLabels) as FilterPeriod[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              background: period === p ? '#1a5fa8' : 'transparent',
              color: period === p ? 'white' : '#6b7280',
              transition: 'all 0.15s'
            }}>
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          placeholder="Search invoice, product, customer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', minWidth: '260px', outline: 'none' }}
        />
      </div>

      {/* Invoice List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Loading invoices...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', fontSize: '16px' }}>
          No invoices found for {periodLabels[period].toLowerCase()}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(inv => (
            <div key={inv.invoice_id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              {/* Invoice Row Header */}
              <div
                onClick={() => setExpanded(expanded === inv.invoice_id ? null : inv.invoice_id)}
                style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', gap: '16px' }}
              >
                {/* Invoice Number */}
                <div style={{ flex: '0 0 200px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a5fa8' }}>{inv.invoice_number}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{formatDate(inv.created_at)}</div>
                </div>

                {/* Customer */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#374151' }}>👤 {inv.customer_name || 'Walk-in Customer'}</div>
                </div>

                {/* Items count */}
                <div style={{ flex: '0 0 100px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>{inv.items?.length || 0} item(s)</div>
                </div>

                {/* GST */}
                <div style={{ flex: '0 0 120px', textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>GST</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#7c3aed' }}>₹{Number(inv.total_tax || 0).toFixed(2)}</div>
                </div>

                {/* Total */}
                <div style={{ flex: '0 0 130px', textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>₹{Number(inv.total_amount || 0).toFixed(2)}</div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: statusColor(inv.status), background: `${statusColor(inv.status)}15`, padding: '2px 8px', borderRadius: '999px' }}>
                    {inv.status}
                  </span>
                </div>

                {/* Expand */}
                <div style={{ fontSize: '18px', color: '#9ca3af' }}>{expanded === inv.invoice_id ? '▲' : '▼'}</div>
              </div>

              {/* Expanded Items Table */}
              {expanded === inv.invoice_id && (
                <div style={{ borderTop: '1px solid #f3f4f6', padding: '0 20px 16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        {['Product', 'Qty', 'Unit Price', 'Discount', 'Taxable Amt', 'CGST', 'SGST', 'IGST', 'Total'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Product' ? 'left' : 'right', color: '#6b7280', fontWeight: 600, fontSize: '12px', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(inv.items || []).map((item: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: '#111827' }}>{item.product_name || item.variant_id}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>{Number(item.quantity)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>₹{Number(item.unit_price).toFixed(2)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#16a34a' }}>-₹{Number(item.discount_amount || 0).toFixed(2)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>₹{Number(item.taxable_amount).toFixed(2)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#7c3aed' }}>₹{Number(item.cgst_amount).toFixed(2)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#7c3aed' }}>₹{Number(item.sgst_amount).toFixed(2)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#7c3aed' }}>₹{Number(item.igst_amount).toFixed(2)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>₹{Number(item.subtotal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f9fafb', fontWeight: 700 }}>
                        <td colSpan={4} style={{ padding: '10px 12px', color: '#6b7280' }}>Totals</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>₹{Number(inv.total_amount - inv.total_tax).toFixed(2)}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#7c3aed' }}>₹{Number(inv.total_cgst || 0).toFixed(2)}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#7c3aed' }}>₹{Number(inv.total_sgst || 0).toFixed(2)}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#7c3aed' }}>₹{Number(inv.total_igst || 0).toFixed(2)}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '15px', color: '#111827' }}>₹{Number(inv.total_amount).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Invoice meta */}
                  <div style={{ display: 'flex', gap: '24px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f3f4f6', fontSize: '12px', color: '#6b7280' }}>
                    <span>🏷️ Tax Mode: <strong>{inv.tax_mode || 'EXCLUSIVE'}</strong></span>
                    <span>📍 Place of Supply: <strong>{inv.place_of_supply || 'Unknown'}</strong></span>
                    <span>💳 Outstanding: <strong style={{ color: inv.outstanding_amount > 0 ? '#dc2626' : '#16a34a' }}>₹{Number(inv.outstanding_amount || 0).toFixed(2)}</strong></span>
                    {inv.round_off != null && <span>🔢 Round Off: <strong>₹{Number(inv.round_off).toFixed(2)}</strong></span>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceHistory;