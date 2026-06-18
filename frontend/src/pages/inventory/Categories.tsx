import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');

  const fetchCategories = async () => {
    const res = await api.get('/inventory/categories');
    setCategories(res.data);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/inventory/categories', { name });
    setName('');
    fetchCategories();
  };

  return (
    <div>
      <h2>Categories</h2>
      <form onSubmit={handleAdd}>
        <input value={name} onChange={e => setName(e.target.value)} required placeholder="Category Name" style={{padding:'5px', marginRight:'5px'}}/>
        <button type="submit" style={{padding:'5px'}}>Add</button>
      </form>
      <ul>
        {categories.map((c: any) => <li key={c.category_id}>{c.name}</li>)}
      </ul>
    </div>
  );
};
export default Categories;
