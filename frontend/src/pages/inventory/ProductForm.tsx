import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Barcode from 'react-barcode';

interface ProductFormProps {
  isViewOnly?: boolean;
}

// Unit definitions with their sub-units and default conversion factors
const UNIT_CONFIG: Record<string, { subUnits: string[]; defaultConversion: Record<string, number>; fixedConversion: boolean }> = {
  KG:     { subUnits: ['Grams'],  defaultConversion: { Grams: 1000 },  fixedConversion: false },
  Liter:  { subUnits: ['ML'],     defaultConversion: { ML: 1000 },     fixedConversion: false },
  Meter:  { subUnits: ['Feet', 'CM'], defaultConversion: { Feet: 3.281, CM: 100 }, fixedConversion: false },
  Packet: { subUnits: ['Packet'], defaultConversion: { Packet: 1 },    fixedConversion: true  },
  Piece:  { subUnits: ['Piece'],  defaultConversion: { Piece: 1 },     fixedConversion: true  },
  Box:    { subUnits: ['Piece'],  defaultConversion: { Piece: 12 },    fixedConversion: false },
  Dozen:  { subUnits: ['Piece'],  defaultConversion: { Piece: 12 },    fixedConversion: false },
};

const MAIN_UNITS = Object.keys(UNIT_CONFIG);

const ProductForm: React.FC<ProductFormProps> = ({ isViewOnly = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [product, setProduct] = useState<any>({
    name: '', category_id: '', hsn_code: '', tax_rate: '',
    main_unit: '', sub_unit: '', conversion_factor: ''
  });
  const [variant, setVariant] = useState<any>({
    barcode: '', sku: '', purchase_price: '', selling_price: ''
  });

  // Derived sub-unit options based on selected main unit
  const subUnitOptions = product.main_unit ? UNIT_CONFIG[product.main_unit]?.subUnits || [] : [];
  const isFixedConversion = product.main_unit ? UNIT_CONFIG[product.main_unit]?.fixedConversion : false;

  useEffect(() => {
    api.get('/inventory/categories').then(res => setCategories(res.data));
    if (id) {
      api.get(`/inventory/products/${id}`).then(res => {
        const data = res.data;
        setProduct({
          name: data.name,
          category_id: data.category_id,
          hsn_code: data.hsn_code,
          tax_rate: data.tax_rate,
          main_unit: data.main_unit || '',
          sub_unit: data.sub_unit || '',
          conversion_factor: data.conversion_factor || ''
        });
        if (data.variants && data.variants.length > 0) {
          setVariant({
            barcode: data.variants[0].barcode,
            sku: data.variants[0].sku,
            purchase_price: data.variants[0].purchase_price,
            selling_price: data.variants[0].selling_price
          });
        }
      });
    }
  }, [id]);

  // When main unit changes, auto-set sub unit and default conversion factor
  const handleMainUnitChange = (unit: string) => {
    const config = UNIT_CONFIG[unit];
    if (!config) {
      setProduct({ ...product, main_unit: unit, sub_unit: '', conversion_factor: '' });
      return;
    }
    const defaultSubUnit = config.subUnits[0];
    const defaultConv = config.defaultConversion[defaultSubUnit];
    setProduct({
      ...product,
      main_unit: unit,
      sub_unit: defaultSubUnit,
      conversion_factor: config.fixedConversion ? defaultConv : defaultConv
    });
  };

  // When sub unit changes, update default conversion factor
  const handleSubUnitChange = (subUnit: string) => {
    const config = UNIT_CONFIG[product.main_unit];
    const defaultConv = config?.defaultConversion[subUnit] || 1;
    setProduct({ ...product, sub_unit: subUnit, conversion_factor: defaultConv });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewOnly) return;

    const payload = { ...product, variants: [variant] };

    if (id) {
      await api.put(`/inventory/products/${id}`, payload);
      alert('Product Updated!');
    } else {
      await api.post('/inventory/products', payload);
      alert('Product Created!');
    }
    navigate('/app/products');
  };

  const inputStyle: React.CSSProperties = {
    margin: '5px', padding: '8px 10px',
    border: '1px solid #ccc', borderRadius: '6px',
    fontSize: '14px', width: '100%', boxSizing: 'border-box'
  };
  const selectStyle: React.CSSProperties = { ...inputStyle, backgroundColor: 'white', cursor: isViewOnly ? 'not-allowed' : 'pointer' };
  const labelStyle: React.CSSProperties = { marginLeft: '5px', marginTop: '10px', fontSize: '13px', fontWeight: 600, color: '#444' };
  const sectionStyle: React.CSSProperties = {
    border: '1px solid #e0e0e0', borderRadius: '8px',
    padding: '14px', marginTop: '12px', backgroundColor: '#fafafa'
  };

  return (
    <div style={{ maxWidth: '520px', padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>
        {isViewOnly ? 'View Product' : (id ? 'Edit Product' : 'Create Product')}
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>

        {/* ── Basic Info ── */}
        <div style={sectionStyle}>
          <strong style={{ fontSize: '13px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Basic Info</strong>

          <div style={labelStyle}>Product Name *</div>
          <input
            placeholder="e.g. PVC Pipe 1 inch"
            value={product.name}
            onChange={e => setProduct({ ...product, name: e.target.value })}
            required disabled={isViewOnly} style={inputStyle}
          />

          <div style={labelStyle}>Category</div>
          <select value={product.category_id} onChange={e => setProduct({ ...product, category_id: e.target.value })} disabled={isViewOnly} style={selectStyle}>
            <option value="">Select Category</option>
            {categories.map((c: any) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
          </select>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>HSN Code</div>
              <input placeholder="e.g. 9887" value={product.hsn_code} onChange={e => setProduct({ ...product, hsn_code: e.target.value })} disabled={isViewOnly} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>GST Rate (%)</div>
              <input type="number" placeholder="e.g. 18" value={product.tax_rate} onChange={e => setProduct({ ...product, tax_rate: e.target.value === '' ? '' : Number(e.target.value) })} disabled={isViewOnly} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* ── Unit Configuration ── */}
        <div style={{ ...sectionStyle, backgroundColor: '#f0f7ff', borderColor: '#b3d4ff' }}>
          <strong style={{ fontSize: '13px', color: '#1a5fa8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📦 Unit Configuration</strong>

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            {/* Main Unit */}
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>Main Unit</div>
              <select
                value={product.main_unit}
                onChange={e => handleMainUnitChange(e.target.value)}
                disabled={isViewOnly}
                style={{ ...selectStyle, borderColor: '#4a90d9' }}
              >
                <option value="">Select Unit</option>
                {MAIN_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            {/* Sub Unit */}
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>Sub Unit</div>
              <select
                value={product.sub_unit}
                onChange={e => handleSubUnitChange(e.target.value)}
                disabled={isViewOnly || !product.main_unit || subUnitOptions.length <= 1}
                style={{ ...selectStyle, borderColor: '#4a90d9', opacity: !product.main_unit ? 0.5 : 1 }}
              >
                <option value="">Select Sub Unit</option>
                {subUnitOptions.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Conversion Factor */}
          {product.main_unit && product.sub_unit && (
            <div style={{ marginTop: '10px' }}>
              <div style={labelStyle}>
                Conversion Factor
                <span style={{ fontWeight: 400, color: '#888', marginLeft: '6px' }}>
                  (1 {product.main_unit} = ? {product.sub_unit})
                </span>
              </div>

              {isFixedConversion ? (
                <div style={{
                  ...inputStyle, backgroundColor: '#e8e8e8', color: '#666',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <span>🔒</span>
                  <span>1 {product.main_unit} = 1 {product.sub_unit} (Fixed — same unit)</span>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder={`e.g. ${UNIT_CONFIG[product.main_unit]?.defaultConversion[product.sub_unit] || 1}`}
                    value={product.conversion_factor}
                    onChange={e => setProduct({ ...product, conversion_factor: e.target.value === '' ? '' : Number(e.target.value) })}
                    disabled={isViewOnly}
                    style={{ ...inputStyle, borderColor: '#4a90d9', paddingRight: '120px' }}
                  />
                  <span style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    fontSize: '12px', color: '#888', pointerEvents: 'none'
                  }}>
                    {product.sub_unit} per {product.main_unit}
                  </span>
                </div>
              )}

              {/* Live preview */}
              {!isFixedConversion && product.conversion_factor && (
                <div style={{
                  marginTop: '6px', padding: '8px 12px',
                  backgroundColor: '#e6f3ff', borderRadius: '6px',
                  fontSize: '13px', color: '#1a5fa8'
                }}>
                  ✅ 1 {product.main_unit} = {product.conversion_factor} {product.sub_unit}
                  {' | '}
                  1 {product.sub_unit} = {(1 / Number(product.conversion_factor)).toFixed(4)} {product.main_unit}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Variant Details ── */}
        <div style={sectionStyle}>
          <strong style={{ fontSize: '13px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Variant Details</strong>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>SKU</div>
              <input placeholder="e.g. PVC-1IN-001" value={variant.sku} onChange={e => setVariant({ ...variant, sku: e.target.value })} disabled={isViewOnly} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>Barcode</div>
              <input placeholder="Barcode string" value={variant.barcode} onChange={e => setVariant({ ...variant, barcode: e.target.value })} disabled={isViewOnly} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>Purchase Price (₹)</div>
              <input type="number" placeholder="0.00" value={variant.purchase_price} onChange={e => setVariant({ ...variant, purchase_price: e.target.value === '' ? '' : Number(e.target.value) })} disabled={isViewOnly} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>Selling Price (₹)</div>
              <input type="number" placeholder="0.00" value={variant.selling_price} onChange={e => setVariant({ ...variant, selling_price: e.target.value === '' ? '' : Number(e.target.value) })} disabled={isViewOnly} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          {!isViewOnly && (
            <button type="submit" style={{ flex: 2, padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
              {id ? '💾 Update Product' : '✅ Create Product'}
            </button>
          )}
          <button type="button" onClick={() => navigate('/app/products')} style={{ flex: 1, padding: '12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}>
            ← Back
          </button>
        </div>
      </form>

      {variant.barcode && (
        <div style={{ marginTop: '24px', padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 12px 0' }}>Generated Barcode</h4>
          <Barcode value={variant.barcode} />
        </div>
      )}
    </div>
  );
};

export default ProductForm;