import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Barcode from 'react-barcode';

interface ProductFormProps {
  isViewOnly?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ isViewOnly = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [product, setProduct] = useState<any>({ name: '', category_id: '', hsn_code: '', tax_rate: '' });
  const [variant, setVariant] = useState<any>({ barcode: '', sku: '', purchase_price: '', selling_price: '' });

  useEffect(() => {
    api.get('/inventory/categories').then(res => setCategories(res.data));
    if (id) {
      api.get(`/inventory/products/${id}`).then(res => {
        const data = res.data;
        setProduct({
          name: data.name,
          category_id: data.category_id,
          hsn_code: data.hsn_code,
          tax_rate: data.tax_rate
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewOnly) return;
    
    if (id) {
      await api.put(`/inventory/products/${id}`, {
        ...product,
        variants: [variant]
      });
      alert('Product Updated!');
    } else {
      await api.post('/inventory/products', {
        ...product,
        variants: [variant]
      });
      alert('Product Created!');
    }
    navigate('/app/products');
  };

  return (
    <div>
      <h2>{isViewOnly ? 'View Product' : (id ? 'Edit Product' : 'Create Product')}</h2>
      <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', width: '400px'}}>
        <input placeholder="Name" value={product.name} onChange={e => setProduct({...product, name: e.target.value})} required disabled={isViewOnly} style={{margin:'5px', padding:'5px'}}/>
        <select value={product.category_id} onChange={e => setProduct({...product, category_id: e.target.value})} disabled={isViewOnly} style={{margin:'5px', padding:'5px'}}>
          <option value="">Select Category</option>
          {categories.map((c: any) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
        </select>
        <input placeholder="HSN Code" value={product.hsn_code} onChange={e => setProduct({...product, hsn_code: e.target.value})} disabled={isViewOnly} style={{margin:'5px', padding:'5px'}}/>
        <input type="number" placeholder="Tax Rate" value={product.tax_rate} onChange={e => setProduct({...product, tax_rate: e.target.value === '' ? '' : Number(e.target.value)})} disabled={isViewOnly} style={{margin:'5px', padding:'5px'}}/>
        
        <h4 style={{marginLeft: '5px'}}>Variant Details</h4>
        <input placeholder="SKU" value={variant.sku} onChange={e => setVariant({...variant, sku: e.target.value})} disabled={isViewOnly} style={{margin:'5px', padding:'5px'}}/>
        <input placeholder="Barcode String" value={variant.barcode} onChange={e => setVariant({...variant, barcode: e.target.value})} disabled={isViewOnly} style={{margin:'5px', padding:'5px'}}/>
        <input type="number" placeholder="Purchase Price" value={variant.purchase_price} onChange={e => setVariant({...variant, purchase_price: e.target.value === '' ? '' : Number(e.target.value)})} disabled={isViewOnly} style={{margin:'5px', padding:'5px'}}/>
        <input type="number" placeholder="Selling Price" value={variant.selling_price} onChange={e => setVariant({...variant, selling_price: e.target.value === '' ? '' : Number(e.target.value)})} disabled={isViewOnly} style={{margin:'5px', padding:'5px'}}/>
        
        {!isViewOnly && (
          <button type="submit" style={{margin:'5px', padding:'10px', backgroundColor:'#28a745', color:'white'}}>Save Product</button>
        )}
        <button type="button" onClick={() => navigate('/app/products')} style={{margin:'5px', padding:'10px', backgroundColor:'#6c757d', color:'white'}}>Back</button>
      </form>
      
      {variant.barcode && (
        <div style={{marginTop: '20px', marginLeft: '5px'}}>
          <h4>Generated Barcode:</h4>
          <Barcode value={variant.barcode} />
        </div>
      )}
    </div>
  );
};
export default ProductForm;
