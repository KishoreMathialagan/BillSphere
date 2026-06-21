import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { NeuoCard } from '../../components/molecules/NeuoCard';
import { Input } from '../../components/atoms/Input';

const GSTReports: React.FC = () => {
  const [reportType, setReportType] = useState('gstr1');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [reportType, startDate, endDate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/gst/${reportType}?start_date=${startDate}&end_date=${endDate}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const renderGstr12 = (items: any[]) => {
    if (!items || items.length === 0) return <div style={{ padding: 'var(--space-8)', textAlign: 'center', opacity: 0.5 }} className="body">No data found for this period.</div>;
    
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--color-cyprus-glass)', borderBottom: '1px solid var(--color-sand-dark)' }}>
            <tr>
              <th className="data-label" style={{ padding: 'var(--space-4)', color: 'var(--color-cyprus)' }}>Date</th>
              <th className="data-label" style={{ padding: 'var(--space-4)', color: 'var(--color-cyprus)' }}>Invoice/Purchase No</th>
              <th className="data-label" style={{ padding: 'var(--space-4)', color: 'var(--color-cyprus)' }}>Place of Supply</th>
              <th className="data-label" style={{ padding: 'var(--space-4)', color: 'var(--color-cyprus)', textAlign: 'right' }}>Taxable Value</th>
              <th className="data-label" style={{ padding: 'var(--space-4)', color: 'var(--color-cyprus)', textAlign: 'right' }}>CGST</th>
              <th className="data-label" style={{ padding: 'var(--space-4)', color: 'var(--color-cyprus)', textAlign: 'right' }}>SGST</th>
              <th className="data-label" style={{ padding: 'var(--space-4)', color: 'var(--color-cyprus)', textAlign: 'right' }}>IGST</th>
              <th className="data-label" style={{ padding: 'var(--space-4)', color: 'var(--color-cyprus)', textAlign: 'right' }}>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--color-sand-dark)' }} className="hover-row">
                <td style={{ padding: 'var(--space-4)' }} className="body">{new Date(item.date).toLocaleDateString()}</td>
                <td style={{ padding: 'var(--space-4)' }} className="body-sm">{item.invoice_number || item.purchase_number}</td>
                <td style={{ padding: 'var(--space-4)' }} className="body-sm">{item.place_of_supply}</td>
                <td style={{ padding: 'var(--space-4)', textAlign: 'right' }} className="body">₹{item.taxable_value.toFixed(2)}</td>
                <td style={{ padding: 'var(--space-4)', textAlign: 'right' }} className="body-sm">₹{item.total_cgst.toFixed(2)}</td>
                <td style={{ padding: 'var(--space-4)', textAlign: 'right' }} className="body-sm">₹{item.total_sgst.toFixed(2)}</td>
                <td style={{ padding: 'var(--space-4)', textAlign: 'right' }} className="body-sm">₹{item.total_igst.toFixed(2)}</td>
                <td style={{ padding: 'var(--space-4)', textAlign: 'right', fontWeight: 600 }} className="body">₹{item.total_value.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <style>{`
          .hover-row:hover {
            background-color: var(--color-cyprus-tint);
          }
        `}</style>
      </div>
    );
  };

  const renderGstr3b = (summary: any) => {
    if (!summary) return <div style={{ padding: 'var(--space-8)', textAlign: 'center', opacity: 0.5 }} className="body">No data found for this period.</div>;
    
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
        <NeuoCard style={{ background: 'var(--color-sand)' }}>
          <h3 className="heading-3" style={{ marginBottom: 'var(--space-4)' }}>Outward Supplies</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }} className="body"><span style={{ opacity: 0.7 }}>Taxable Value</span><span style={{ fontWeight: 600 }}>₹{summary.outward_supplies.taxable_value.toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }} className="body"><span style={{ opacity: 0.7 }}>CGST</span><span style={{ fontWeight: 600 }}>₹{summary.outward_supplies.cgst.toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }} className="body"><span style={{ opacity: 0.7 }}>SGST</span><span style={{ fontWeight: 600 }}>₹{summary.outward_supplies.sgst.toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }} className="body"><span style={{ opacity: 0.7 }}>IGST</span><span style={{ fontWeight: 600 }}>₹{summary.outward_supplies.igst.toFixed(2)}</span></div>
        </NeuoCard>
        
        <NeuoCard style={{ background: 'var(--color-sand)' }}>
          <h3 className="heading-3" style={{ marginBottom: 'var(--space-4)' }}>Eligible ITC</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }} className="body"><span style={{ opacity: 0.7 }}>CGST</span><span style={{ fontWeight: 600 }}>₹{summary.eligible_itc.cgst.toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }} className="body"><span style={{ opacity: 0.7 }}>SGST</span><span style={{ fontWeight: 600 }}>₹{summary.eligible_itc.sgst.toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }} className="body"><span style={{ opacity: 0.7 }}>IGST</span><span style={{ fontWeight: 600 }}>₹{summary.eligible_itc.igst.toFixed(2)}</span></div>
        </NeuoCard>
        
        <NeuoCard style={{ background: 'var(--color-cyprus)', color: 'var(--color-sand)' }}>
          <h3 className="heading-3" style={{ marginBottom: 'var(--space-4)', color: 'var(--color-sand)' }}>Net Tax Liability</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }} className="body"><span style={{ opacity: 0.7 }}>CGST</span><span style={{ fontWeight: 600 }}>₹{summary.net_liability.cgst.toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }} className="body"><span style={{ opacity: 0.7 }}>SGST</span><span style={{ fontWeight: 600 }}>₹{summary.net_liability.sgst.toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }} className="body"><span style={{ opacity: 0.7 }}>IGST</span><span style={{ fontWeight: 600 }}>₹{summary.net_liability.igst.toFixed(2)}</span></div>
        </NeuoCard>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h2 className="heading-2">GST Reports</h2>
        <p className="body" style={{ color: 'var(--color-night-60)' }}>View tax summaries and file returns accurately.</p>
      </div>
      
      <NeuoCard style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label className="data-label" style={{ display: 'block', marginBottom: '8px' }}>Report Type</label>
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            style={{ width: '100%', height: '44px', padding: '0 16px', borderRadius: 'var(--radius-md)', background: 'var(--color-sand)', border: 'none', boxShadow: 'var(--shadow-neuo-inset)', outline: 'none', fontFamily: 'var(--font-body)', fontSize: '16px' }}
          >
            <option value="gstr1">GSTR-1 (Outward Supplies)</option>
            <option value="gstr2">GSTR-2 (Inward Supplies)</option>
            <option value="gstr3b">GSTR-3B (Summary & Net Liability)</option>
          </select>
        </div>
        
        <div style={{ flex: 1, minWidth: '200px' }}>
          <Input 
            type="date" 
            label="Start Date"
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        
        <div style={{ flex: 1, minWidth: '200px' }}>
          <Input 
            type="date" 
            label="End Date"
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </NeuoCard>
      
      <NeuoCard style={{ padding: 0, overflow: 'hidden', minHeight: '300px' }}>
        {loading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', opacity: 0.6 }} className="body">Loading report data...</div>
        ) : (
          <div style={{ padding: 'var(--space-6)' }}>
            {reportType === 'gstr1' || reportType === 'gstr2' ? renderGstr12(data) : renderGstr3b(data)}
          </div>
        )}
      </NeuoCard>
    </div>
  );
};

export default GSTReports;
