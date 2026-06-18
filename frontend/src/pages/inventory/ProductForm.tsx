import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Barcode from 'react-barcode';

const ProductForm = () => {
  const [categories, setCategories] = useState([]);
  const [product, setProduct] = useState({ name: '', category_id: '', hsn_code: '', tax_rate: 0 });
  const [variant, setVariant] = useState({ barcode: '', sku: '', purchase_price: 0, selling_price: 0 });

  useEffect(() => {
    api.get('/inventory/categories').then(res => setCategories(res.data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/inventory/products', {
      ...product,
      variants: [variant]
    });
    alert('Product Created!');
  };

  return (
    <div>
      <h2>Create Product</h2>
      <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', width: '400px'}}>
        <input placeholder="Name" value={product.name} onChange={e => setProduct({...product, name: e.target.value})} required style={{margin:'5px', padding:'5px'}}/>
        <select value={product.category_id} onChange={e => setProduct({...product, category_id: e.target.value})} style={{margin:'5px', padding:'5px'}}>
          <option value="">Select Category</option>
          {categories.map((c: any) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
        </select>
        <input placeholder="HSN Code" value={product.hsn_code} onChange={e => setProduct({...product, hsn_code: e.target.value})} style={{margin:'5px', padding:'5px'}}/>
        <input type="number" placeholder="Tax Rate" value={product.tax_rate} onChange={e => setProduct({...product, tax_rate: +e.target.value})} style={{margin:'5px', padding:'5px'}}/>
        
        <h4 style={{marginLeft: '5px'}}>Variant Details</h4>
        <input placeholder="SKU" value={variant.sku} onChange={e => setVariant({...variant, sku: e.target.value})} style={{margin:'5px', padding:'5px'}}/>
        <input placeholder="Barcode String" value={variant.barcode} onChange={e => setVariant({...variant, barcode: e.target.value})} style={{margin:'5px', padding:'5px'}}/>
        <input type="number" placeholder="Purchase Price" value={variant.purchase_price} onChange={e => setVariant({...variant, purchase_price: +e.target.value})} style={{margin:'5px', padding:'5px'}}/>
        <input type="number" placeholder="Selling Price" value={variant.selling_price} onChange={e => setVariant({...variant, selling_price: +e.target.value})} style={{margin:'5px', padding:'5px'}}/>
        
        <button type="submit" style={{margin:'5px', padding:'10px', backgroundColor:'#28a745', color:'white'}}>Save Product</button>
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
