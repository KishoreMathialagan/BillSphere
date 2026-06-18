import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import VendorForm from './VendorForm';

const Vendors: React.FC = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vendors');
      setVendors(res.data || []);
    } catch (err) {
      console.error('Failed to load vendors', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleCreateVendor = async (data: any) => {
    try {
      setSubmitting(true);
      await api.post('/vendors', data);
      setIsModalOpen(false);
      fetchVendors();
    } catch (err) {
      console.error('Failed to create vendor', err);
      alert('Error creating vendor. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter vendors by search term
  const filteredVendors = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.phone && v.phone.includes(search)) ||
    (v.email && v.email.toLowerCase().includes(search.toLowerCase()))
  );

  // Compute metrics
  const totalVendors = vendors.length;
  const totalOutstanding = vendors.reduce((sum, v) => sum + (v.outstanding_balance || 0), 0);
  const payablesCount = vendors.filter(v => (v.outstanding_balance || 0) > 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', textAlign: 'left' }}>
      
      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
      }}>
        {[
          { label: 'Total Vendors', value: totalVendors, icon: '🏢', color: 'var(--accent)' },
          { label: 'Outstanding Payables', value: `$${totalOutstanding.toFixed(2)}`, icon: '💰', color: '#ef4444' },
          { label: 'Vendors to Pay', value: payablesCount, icon: '💸', color: '#f59e0b' },
        ].map((stat, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--code-bg)',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}
          >
            <div>
              <span style={{ fontSize: '13px', fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {stat.label}
              </span>
              <h3 style={{
                margin: '8px 0 0',
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--text-h)'
              }}>
                {loading ? '...' : stat.value}
              </h3>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Actions Section */}
      <div style={{
        background: 'var(--bg)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          {/* Search bar */}
          <div style={{ position: 'relative', flexGrow: 1, maxWidth: '400px' }}>
            <input
              type="text"
              placeholder="🔍 Search vendors by name, phone or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--code-bg)',
                color: 'var(--text-h)',
                boxSizing: 'border-box',
                fontSize: '14px'
              }}
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px var(--accent-bg)',
              transition: 'transform 0.2s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
          >
            🏢 Add Vendor
          </button>
        </div>

        {/* Vendor Listing */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>Loading vendor registry...</div>
        ) : filteredVendors.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 40px',
            border: '1px dashed var(--border)',
            borderRadius: '8px',
            opacity: 0.8
          }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🏢</span>
            <strong>No vendors found</strong>
            <p style={{ fontSize: '13px', marginTop: '4px', opacity: 0.7 }}>
              {search ? 'Try adjusting your search criteria.' : 'Start adding vendor accounts to manage payables.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-h)' }}>Vendor Name</th>
                  <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-h)' }}>Phone</th>
                  <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-h)' }}>Email</th>
                  <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-h)' }}>GSTIN</th>
                  <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-h)', textAlign: 'right' }}>Outstanding</th>
                  <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-h)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.vendor_id} style={{ borderBottom: '1px solid var(--code-bg)' }}>
                    <td style={{ padding: '16px 12px', fontWeight: 500, color: 'var(--text-h)' }}>{vendor.name}</td>
                    <td style={{ padding: '16px 12px' }}>{vendor.phone || '-'}</td>
                    <td style={{ padding: '16px 12px' }}>{vendor.email || '-'}</td>
                    <td style={{ padding: '16px 12px' }}>{vendor.gst_number || '-'}</td>
                    <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 600, color: vendor.outstanding_balance > 0 ? '#ef4444' : 'var(--text)' }}>
                      ${(vendor.outstanding_balance || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                      <button
                        onClick={() => navigate(`/app/vendors/${vendor.vendor_id}`)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--accent)',
                          background: 'transparent',
                          color: 'var(--accent)',
                          cursor: 'pointer',
                          fontWeight: 500,
                          fontSize: '12px'
                        }}
                      >
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg)', borderRadius: '16px', padding: '32px',
            width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <VendorForm 
              onSubmit={handleCreateVendor}
              onCancel={() => setIsModalOpen(false)}
              isSubmitting={submitting}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default Vendors;
