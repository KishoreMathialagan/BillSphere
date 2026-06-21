import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [products, setProducts] = useState([]);
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
    await api.post('/inventory/categories', { name });
    setName('');
    fetchData();
  };

  const selectedCategoryObj = categories.find((c: any) => c.category_id === selectedCategory);
  const categoryProducts = products.filter((p: any) => p.category_id === selectedCategory);

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      <div style={{ flex: 1 }}>
        <h2>Categories</h2>
        <form onSubmit={handleAdd} style={{ marginBottom: '20px' }}>
          <input value={name} onChange={e => setName(e.target.value)} required placeholder="Category Name" style={{padding:'5px', marginRight:'5px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)'}}/>
          <button type="submit" style={{padding:'5px 10px', borderRadius: '4px', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer'}}>Add</button>
        </form>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {categories.map((c: any) => (
            <li 
              key={c.category_id} 
              onClick={() => setSelectedCategory(c.category_id)}
              style={{ 
                padding: '10px', 
                marginBottom: '10px', 
                border: '1px solid var(--border)', 
                borderRadius: '5px', 
                cursor: 'pointer',
                backgroundColor: selectedCategory === c.category_id ? 'var(--code-bg)' : 'var(--bg)',
                fontWeight: selectedCategory === c.category_id ? 'bold' : 'normal',
                color: 'var(--text)'
              }}
            >
              {c.name}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ flex: 1 }}>
        <h2>Products in Category</h2>
        {selectedCategory ? (
          <div>
            <h3 style={{ marginTop: 0 }}>{selectedCategoryObj?.name}</h3>
            {categoryProducts.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {categoryProducts.map((p: any) => (
                  <li key={p.product_id} style={{ padding: '10px', marginBottom: '10px', border: '1px solid var(--border)', borderRadius: '5px', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
                    <strong>{p.name}</strong><br/>
                    <small>Price: ${p.variants[0]?.selling_price.toFixed(2)} | SKU: {p.variants[0]?.sku}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No products found in this category.</p>
            )}
          </div>
        ) : (
          <p style={{ color: 'var(--text-h)', opacity: 0.7 }}>Select a category to view its products.</p>
        )}
      </div>
    </div>
  );
};
export default Categories;
