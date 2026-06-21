import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const Products = () => {
  const [products, setProducts] = useState<any[]>([]);
  const navigate = useNavigate();

  const fetchProducts = () => {
    api.get('/inventory/products').then(res => setProducts(res.data));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await api.delete(`/inventory/products/${id}`);
      fetchProducts();
    }
  };

  return (
    <div>
      <h2>Products</h2>
      <Link to="/app/products/new"><button style={{padding:'10px', marginBottom:'20px'}}>Create New Product</button></Link>
      <ul style={{listStyle: 'none', padding: 0}}>
        {products.map((p: any) => (
          <li key={p.product_id} style={{marginBottom:'10px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: 'var(--bg)'}}>
            <div style={{flexGrow: 1, color: 'var(--text)'}}>
              <strong>{p.name}</strong> - SKU: {p.variants[0]?.sku} - Price: ${p.variants[0]?.selling_price}
            </div>
            <button onClick={() => navigate(`/app/products/${p.product_id}`)} style={{padding: '5px 10px', cursor: 'pointer', borderRadius: '4px'}}>View</button>
            <button onClick={() => navigate(`/app/products/edit/${p.product_id}`)} style={{padding: '5px 10px', cursor: 'pointer', borderRadius: '4px', backgroundColor: '#007bff', color: 'white', border: 'none'}}>Edit</button>
            <button onClick={() => handleDelete(p.product_id)} style={{padding: '5px 10px', cursor: 'pointer', borderRadius: '4px', backgroundColor: '#dc3545', color: 'white', border: 'none'}}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};
export default Products;
