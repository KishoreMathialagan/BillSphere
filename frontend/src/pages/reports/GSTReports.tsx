import React, { useState, useEffect } from 'react';
import api from '../../services/api';

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
    if (!items || items.length === 0) return <p>No data found for this period.</p>;
    
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
            <th style={{ padding: '12px' }}>Date</th>
            <th style={{ padding: '12px' }}>Invoice/Purchase No</th>
            <th style={{ padding: '12px' }}>Place of Supply</th>
            <th style={{ padding: '12px' }}>Taxable Value</th>
            <th style={{ padding: '12px' }}>CGST</th>
            <th style={{ padding: '12px' }}>SGST</th>
            <th style={{ padding: '12px' }}>IGST</th>
            <th style={{ padding: '12px' }}>Total Value</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '12px' }}>{new Date(item.date).toLocaleDateString()}</td>
              <td style={{ padding: '12px' }}>{item.invoice_number || item.purchase_number}</td>
              <td style={{ padding: '12px' }}>{item.place_of_supply}</td>
              <td style={{ padding: '12px' }}>${item.taxable_value.toFixed(2)}</td>
              <td style={{ padding: '12px' }}>${item.total_cgst.toFixed(2)}</td>
              <td style={{ padding: '12px' }}>${item.total_sgst.toFixed(2)}</td>
              <td style={{ padding: '12px' }}>${item.total_igst.toFixed(2)}</td>
              <td style={{ padding: '12px' }}>${item.total_value.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderGstr3b = (summary: any) => {
    if (!summary) return <p>No data found.</p>;
    
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <h3 style={{ marginTop: 0 }}>Outward Supplies</h3>
          <p>Taxable Value: ${summary.outward_supplies.taxable_value.toFixed(2)}</p>
          <p>CGST: ${summary.outward_supplies.cgst.toFixed(2)}</p>
          <p>SGST: ${summary.outward_supplies.sgst.toFixed(2)}</p>
          <p>IGST: ${summary.outward_supplies.igst.toFixed(2)}</p>
        </div>
        <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <h3 style={{ marginTop: 0 }}>Eligible ITC</h3>
          <p>CGST: ${summary.eligible_itc.cgst.toFixed(2)}</p>
          <p>SGST: ${summary.eligible_itc.sgst.toFixed(2)}</p>
          <p>IGST: ${summary.eligible_itc.igst.toFixed(2)}</p>
        </div>
        <div style={{ background: 'var(--accent)', color: 'white', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>Net Tax Liability</h3>
          <p>CGST: ${summary.net_liability.cgst.toFixed(2)}</p>
          <p>SGST: ${summary.net_liability.sgst.toFixed(2)}</p>
          <p>IGST: ${summary.net_liability.igst.toFixed(2)}</p>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>GST Reports</h2>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', background: 'var(--code-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600 }}>Report Type</label>
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          >
            <option value="gstr1">GSTR-1 (Outward Supplies)</option>
            <option value="gstr2">GSTR-2 (Inward Supplies / Purchases)</option>
            <option value="gstr3b">GSTR-3B (Summary & Net Liability)</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600 }}>Start Date</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600 }}>End Date</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
        </div>
      </div>
      
      {loading ? (
        <p>Loading report data...</p>
      ) : (
        <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          {reportType === 'gstr1' || reportType === 'gstr2' ? renderGstr12(data) : renderGstr3b(data)}
        </div>
      )}
    </div>
  );
};

export default GSTReports;
