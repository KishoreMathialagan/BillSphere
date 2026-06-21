import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { NeuoCard } from '../../components/molecules/NeuoCard';
import { Button } from '../../components/atoms/Button';
import { Input } from '../../components/atoms/Input';
import { Badge } from '../../components/atoms/Badge';

const Categories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchData = async () => {
    const catRes = await api.get('/inventory/categories');
    setCategories(catRes.data);
    const prodRes = await api.get('/inventory/products');
    setProducts(prodRes.data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await api.post('/inventory/categories', { name });
    setName('');
    fetchData();
  };

  const selectedCategoryObj = categories.find((c: any) => c.category_id === selectedCategory);
  const categoryProducts = products.filter((p: any) => p.category_id === selectedCategory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h2 className="heading-2">Categories</h2>
        <p className="body" style={{ color: 'var(--color-night-60)' }}>Organize your products into categories for easier management and reporting.</p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-6)', height: 'calc(100vh - 200px)' }}>
        {/* Left Side: Categories List */}
        <NeuoCard style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-sand-dark)', background: 'var(--color-cyprus-glass)' }}>
            <h3 className="heading-3" style={{ margin: '0 0 var(--space-4) 0' }}>All Categories</h3>
            <form onSubmit={handleAdd} style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <div style={{ flexGrow: 1 }}>
                <Input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="New category name..." 
                  style={{ height: '36px' }}
                />
              </div>
              <Button type="submit" variant="filled" size="sm">Add</Button>
            </form>
          </div>
          
          <div style={{ flexGrow: 1, overflowY: 'auto', padding: 'var(--space-2)' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {categories.map((c: any) => (
                <li 
                  key={c.category_id} 
                  onClick={() => setSelectedCategory(c.category_id)}
                  style={{ 
                    padding: 'var(--space-3) var(--space-4)', 
                    marginBottom: 'var(--space-1)', 
                    borderRadius: 'var(--radius-md)', 
                    cursor: 'pointer',
                    backgroundColor: selectedCategory === c.category_id ? 'var(--color-cyprus-glass)' : 'transparent',
                    boxShadow: selectedCategory === c.category_id ? 'var(--shadow-neuo-inset)' : 'none',
                    fontWeight: selectedCategory === c.category_id ? 700 : 500,
                    color: selectedCategory === c.category_id ? 'var(--color-cyprus)' : 'var(--color-night)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span className="body">{c.name}</span>
                  <Badge variant={selectedCategory === c.category_id ? "cyprus" : "info"}>
                    {products.filter(p => p.category_id === c.category_id).length} Items
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        </NeuoCard>

        {/* Right Side: Products in Category */}
        <NeuoCard style={{ flex: 2, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
          {selectedCategory ? (
            <>
              <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-sand-dark)' }}>
                <h3 className="heading-3" style={{ margin: 0 }}>
                  Products in "{selectedCategoryObj?.name}"
                </h3>
              </div>
              
              <div style={{ flexGrow: 1, overflowY: 'auto', padding: 'var(--space-4)' }}>
                {categoryProducts.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
                    {categoryProducts.map((p: any) => (
                      <div key={p.product_id} style={{ 
                        padding: 'var(--space-4)', 
                        border: '1px solid var(--color-sand-dark)', 
                        borderRadius: 'var(--radius-md)', 
                        backgroundColor: 'var(--color-sand)',
                        boxShadow: 'var(--shadow-neuo-sm)'
                      }}>
                        <div className="body" style={{ fontWeight: 600, marginBottom: '4px' }}>{p.name}</div>
                        <div className="body-sm" style={{ color: 'var(--color-night-60)', marginBottom: '8px' }}>SKU: {p.variants[0]?.sku || '-'}</div>
                        <div className="metric-md" style={{ color: 'var(--color-cyprus)' }}>₹{p.variants[0]?.selling_price?.toFixed(2) || '0.00'}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>
                    <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>📭</div>
                    <p className="body">No products found in this category.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>
              <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>📁</div>
              <p className="body">Select a category from the left to view its products.</p>
            </div>
          )}
        </NeuoCard>
      </div>
    </div>
  );
};
export default Categories;
