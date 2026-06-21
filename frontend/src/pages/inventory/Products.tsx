import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { NeuoCard } from '../../components/molecules/NeuoCard';
import { Button } from '../../components/atoms/Button';
import { Input } from '../../components/atoms/Input';
import { Badge } from '../../components/atoms/Badge';

const Products = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
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

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.variants[0]?.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="heading-2">Products</h2>
          <p className="body" style={{ color: 'var(--color-night-60)' }}>Manage your inventory items, pricing, and variants.</p>
        </div>
        <Button variant="filled" onClick={() => navigate('/app/products/new')}>
          + New Product
        </Button>
      </div>

      <NeuoCard style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-sand-dark)' }}>
          <Input 
            placeholder="Search products by name or SKU..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<span>🔍</span>}
            style={{ maxWidth: '400px' }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--color-cyprus-glass)', borderBottom: '1px solid var(--color-sand-dark)' }}>
              <tr>
                <th className="data-label" style={{ padding: 'var(--space-4)', color: 'var(--color-cyprus)' }}>Product Name</th>
                <th className="data-label" style={{ padding: 'var(--space-4)', color: 'var(--color-cyprus)' }}>SKU</th>
                <th className="data-label" style={{ padding: 'var(--space-4)', color: 'var(--color-cyprus)' }}>Price</th>
                <th className="data-label" style={{ padding: 'var(--space-4)', color: 'var(--color-cyprus)' }}>Stock</th>
                <th className="data-label" style={{ padding: 'var(--space-4)', color: 'var(--color-cyprus)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p: any) => (
                  <tr key={p.product_id} style={{ borderBottom: '1px solid var(--color-sand-dark)', transition: 'background 0.2s' }}>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <div className="body" style={{ fontWeight: 600 }}>{p.name}</div>
                    </td>
                    <td style={{ padding: 'var(--space-4)' }} className="body-sm">
                      {p.variants[0]?.sku || '-'}
                    </td>
                    <td style={{ padding: 'var(--space-4)' }} className="body">
                      ₹{p.variants[0]?.selling_price?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <Badge variant="info">In Stock</Badge>
                    </td>
                    <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                        <Button variant="neuo" size="sm" onClick={() => navigate(`/app/products/${p.product_id}`)}>View</Button>
                        <Button variant="neuo" size="sm" onClick={() => navigate(`/app/products/edit/${p.product_id}`)}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(p.product_id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center', opacity: 0.5 }} className="body">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </NeuoCard>
    </div>
  );
};
export default Products;
