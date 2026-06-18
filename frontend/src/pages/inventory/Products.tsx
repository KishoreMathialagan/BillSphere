import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const Products = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get('/inventory/products').then(res => setProducts(res.data));
  }, []);

  return (
    <div>
      <h2>Products</h2>
      <Link to="/app/products/new"><button style={{padding:'10px', marginBottom:'20px'}}>Create New Product</button></Link>
      <ul>
        {products.map((p: any) => (
          <li key={p.product_id} style={{marginBottom:'10px'}}>
            <strong>{p.name}</strong> - SKU: {p.variants[0]?.sku} - Price: ${p.variants[0]?.selling_price}
          </li>
        ))}
      </ul>
    </div>
  );
};
export default Products;
