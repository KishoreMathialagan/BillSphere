import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface OCRItem {
  name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  cgst: number;
  sgst: number;
  igst: number;
  tax_percentage: number;
  // UI specific fields
  mapped_variant_id?: string;
}

interface OCRData {
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  items: OCRItem[];
  total_amount: number;
  confidence: number;
}

const OCRPurchase: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [ocrData, setOcrData] = useState<OCRData | null>(null);
  
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [posting, setPosting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchDependencies();
  }, []);

  const fetchDependencies = async () => {
    try {
      const [vRes, pRes] = await Promise.all([
        api.get('/vendor'),
        api.get('/inventory/products')
      ]);
      setVendors(vRes.data);
      setProducts(pRes.data);
    } catch (err) {
      console.error('Failed to load dependencies', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await api.post('/vendor/ocr-extract', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });
      setOcrData(res.data);
      
      // Try to auto-match vendor
      if (res.data.vendor_name) {
        const matched = vendors.find(v => v.name.toLowerCase().includes(res.data.vendor_name.toLowerCase()));
        if (matched) setSelectedVendorId(matched.vendor_id);
      }
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'OCR Extraction failed.');
    } finally {
      setLoading(false);
    }
  };

  const updateItemMapping = (index: number, variantId: string) => {
    if (!ocrData) return;
    const newItems = [...ocrData.items];
    newItems[index].mapped_variant_id = variantId;
    setOcrData({ ...ocrData, items: newItems });
  };

  const handleCreatePurchase = async () => {
    if (!ocrData || !selectedVendorId) {
      setError('Please select a vendor.');
      return;
    }
    
    // Ensure all items are mapped
    const unmapped = ocrData.items.find(i => !i.mapped_variant_id);
    if (unmapped) {
      setError(`Please map product: ${unmapped.name}`);
      return;
    }
    
    setPosting(true);
    setError('');
    
    const payload = {
      vendor_id: selectedVendorId,
      invoice_number: ocrData.invoice_number || `INV-${Date.now()}`,
      invoice_date: ocrData.invoice_date || new Date().toISOString().split('T')[0],
      items: ocrData.items.map(item => ({
        variant_id: item.mapped_variant_id,
        quantity: item.quantity,
        purchase_price: item.unit_price,
        discount_amount: item.discount || 0,
        tax_rate: item.tax_percentage || 0,
        igst_amount: item.igst || 0,
        cgst_amount: item.cgst || 0,
        sgst_amount: item.sgst || 0,
        total_amount: (item.quantity * item.unit_price) + (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0) - (item.discount || 0)
      })),
      discount_amount: 0,
      notes: "Auto-generated via OCR"
    };

    try {
      await api.post('/vendor/purchase', payload);
      setSuccess(true);
      setOcrData(null);
      setFile(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to post purchase entry.');
    } finally {
      setPosting(false);
    }
  };

  if (success) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#10b981' }}>Purchase Successfully Created!</h2>
        <p>The inventory and ledgers have been updated.</p>
        <button 
          onClick={() => setSuccess(false)}
          style={{ padding: '10px 20px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Scan Another Invoice
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 8px', color: 'var(--text-h)' }}>AI Invoice Scanner (OCR)</h1>
      <p style={{ opacity: 0.7, margin: '0 0 24px' }}>Upload a supplier invoice to automatically extract and map line items.</p>

      {!ocrData && (
        <div style={{ background: 'var(--bg)', border: '1px dashed var(--accent)', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            id="invoice-upload"
          />
          <label htmlFor="invoice-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '48px' }}>📄</div>
            <div style={{ fontWeight: 600, color: 'var(--accent)' }}>
              {file ? file.name : 'Click to Upload Invoice Image'}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>JPG, PNG supported</div>
          </label>
          
          <button 
            onClick={handleUpload}
            disabled={!file || loading}
            style={{ 
              marginTop: '24px', padding: '12px 32px', borderRadius: '8px', border: 'none',
              background: loading ? 'var(--border)' : 'var(--accent)', color: 'white', fontWeight: 600,
              cursor: (!file || loading) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Running OCR Engine...' : 'Extract Data'}
          </button>
          
          {error && <div style={{ color: '#ef4444', marginTop: '16px' }}>{error}</div>}
        </div>
      )}

      {ocrData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {ocrData.confidence < 80 && (
            <div style={{ background: '#fef3c7', color: '#b45309', padding: '16px', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>⚠️</span>
              <strong>Manual Review Recommended:</strong> The OCR engine confidence score is low ({ocrData.confidence}%). Please double-check the extracted values below.
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1, background: 'var(--bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Extracted Vendor Name</label>
              <div style={{ fontSize: '16px', fontWeight: 500 }}>{ocrData.vendor_name || 'Unknown'}</div>
              
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, margin: '16px 0 8px' }}>Link to Vendor Profile</label>
              <select 
                value={selectedVendorId} 
                onChange={(e) => setSelectedVendorId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text)' }}
              >
                <option value="">-- Select Vendor --</option>
                {vendors.map(v => <option key={v.vendor_id} value={v.vendor_id}>{v.name}</option>)}
              </select>
            </div>
            
            <div style={{ flex: 1, background: 'var(--bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Invoice Number</label>
              <input 
                type="text" 
                value={ocrData.invoice_number || ''} 
                onChange={(e) => setOcrData({...ocrData, invoice_number: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text)' }}
              />
              
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, margin: '16px 0 8px' }}>Invoice Date</label>
              <input 
                type="date" 
                value={ocrData.invoice_date || ''} 
                onChange={(e) => setOcrData({...ocrData, invoice_date: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text)' }}
              />
            </div>
          </div>

          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'var(--code-bg)' }}>
                <tr>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Extracted Name</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Map to Product</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Qty</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Price</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>GST %</th>
                </tr>
              </thead>
              <tbody>
                {ocrData.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 500 }}>{item.name}</td>
                    <td style={{ padding: '12px' }}>
                      <select 
                        value={item.mapped_variant_id || ''} 
                        onChange={(e) => updateItemMapping(idx, e.target.value)}
                        style={{ width: '200px', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text)' }}
                      >
                        <option value="">-- Select --</option>
                        {products.map(p => 
                          p.variants.map((v: any) => (
                            <option key={v.variant_id} value={v.variant_id}>{p.name} - {v.sku}</option>
                          ))
                        )}
                      </select>
                    </td>
                    <td style={{ padding: '12px' }}>{item.quantity}</td>
                    <td style={{ padding: '12px' }}>${item.unit_price}</td>
                    <td style={{ padding: '12px' }}>{item.tax_percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <div style={{ color: '#ef4444' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button 
              onClick={() => { setOcrData(null); setFile(null); }}
              style={{ padding: '12px 24px', background: 'transparent', color: 'var(--text-h)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              Cancel
            </button>
            <button 
              onClick={handleCreatePurchase}
              disabled={posting}
              style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: posting ? 'not-allowed' : 'pointer', fontWeight: 600 }}
            >
              {posting ? 'Creating Entry...' : 'Confirm & Create Purchase'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OCRPurchase;
