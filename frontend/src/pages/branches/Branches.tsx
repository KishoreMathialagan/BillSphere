import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Branches: React.FC = () => {
  const [branches, setBranches] = useState<any[]>([]);
  const [branchName, setBranchName] = useState('');
  const [address, setAddress] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/branches/${editingId}`, { branch_name: branchName, address });
      } else {
        await api.post('/branches', { branch_name: branchName, address });
      }
      setBranchName('');
      setAddress('');
      setEditingId(null);
      fetchBranches();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save branch');
    }
  };

  const handleEdit = (branch: any) => {
    setEditingId(branch.branch_id);
    setBranchName(branch.branch_name);
    setAddress(branch.address || '');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Branch Management</h1>
      
      <div style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '20px' }}>
        <h2>{editingId ? 'Edit Branch' : 'Add New Branch'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
            <label>Branch Name</label>
            <input required value={branchName} onChange={e => setBranchName(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 2 }}>
            <label>Address</label>
            <input value={address} onChange={e => setAddress(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
          </div>
          <button type="submit" style={{ padding: '10px 20px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
            {editingId ? 'Update' : 'Create'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setBranchName(''); setAddress(''); }} style={{ padding: '10px 20px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}>
              Cancel
            </button>
          )}
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {branches.map((b, i) => (
          <div key={i} style={{ background: 'var(--code-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--accent)' }}>{b.branch_name}</h3>
            <p style={{ margin: '0 0 16px 0', opacity: 0.8, fontSize: '14px' }}>{b.address || 'No address provided'}</p>
            <button onClick={() => handleEdit(b)} style={{ padding: '6px 12px', background: 'transparent', color: 'var(--text-h)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
              Edit Branch
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Branches;
