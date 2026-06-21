import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

const Profile = () => {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    business_name: '',
    logo_url: '',
    branch_name: '',
    address: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setProfile({
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        role: res.data.role || '',
        business_name: res.data.business_name || '',
        logo_url: res.data.logo_url || '',
        branch_name: res.data.branch_name || '',
        address: res.data.address || ''
      });
    } catch (err) {
      console.error('Failed to load profile', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await api.put('/auth/profile', profile);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile', err);
      alert('Failed to update profile.');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, logo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--code-bg)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ margin: 0, color: 'var(--text-h)' }}>My Profile</h2>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          style={{ padding: '10px 20px', borderRadius: '8px', background: isEditing ? '#10b981' : 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '40px' }}>
        {/* Logo Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '200px' }}>
          <div style={{ 
            width: '150px', 
            height: '150px', 
            borderRadius: '50%', 
            background: 'var(--bg)', 
            border: '2px dashed var(--border)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {profile.logo_url ? (
              <img src={profile.logo_url} alt="Brand Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: 'var(--text-h)', opacity: 0.5, fontSize: '48px' }}>🏢</span>
            )}
            
            {isEditing && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', textAlign: 'center', padding: '8px 0', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
              >
                Upload Logo
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" style={{ display: 'none' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 4px', color: 'var(--text-h)' }}>{profile.business_name || 'Brand Name'}</h3>
            <span style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 600, background: 'rgba(99, 102, 241, 0.1)', padding: '4px 12px', borderRadius: '20px' }}>
              {profile.role || 'Role'}
            </span>
          </div>
        </div>

        {/* Details Section */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-h)', opacity: 0.8 }}>First Name</label>
            <input 
              name="first_name" 
              value={profile.first_name} 
              onChange={handleChange} 
              disabled={!isEditing} 
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: isEditing ? 'var(--bg)' : 'transparent', color: 'var(--text)' }} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-h)', opacity: 0.8 }}>Last Name</label>
            <input 
              name="last_name" 
              value={profile.last_name} 
              onChange={handleChange} 
              disabled={!isEditing} 
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: isEditing ? 'var(--bg)' : 'transparent', color: 'var(--text)' }} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-h)', opacity: 0.8 }}>Email Address</label>
            <input 
              name="email" 
              value={profile.email} 
              onChange={handleChange} 
              disabled={!isEditing} 
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: isEditing ? 'var(--bg)' : 'transparent', color: 'var(--text)' }} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-h)', opacity: 0.8 }}>Phone Number</label>
            <input 
              name="phone" 
              value={profile.phone} 
              onChange={handleChange} 
              disabled={!isEditing} 
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: isEditing ? 'var(--bg)' : 'transparent', color: 'var(--text)' }} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1', marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <h4 style={{ margin: 0, color: 'var(--text-h)' }}>Shop & Branch Details</h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-h)', opacity: 0.8 }}>Shop / Brand Name</label>
            <input 
              name="business_name" 
              value={profile.business_name} 
              onChange={handleChange} 
              disabled={!isEditing} 
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: isEditing ? 'var(--bg)' : 'transparent', color: 'var(--text)' }} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-h)', opacity: 0.8 }}>Branch Name</label>
            <input 
              name="branch_name" 
              value={profile.branch_name} 
              onChange={handleChange} 
              disabled={!isEditing} 
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: isEditing ? 'var(--bg)' : 'transparent', color: 'var(--text)' }} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-h)', opacity: 0.8 }}>Branch Address</label>
            <input 
              name="address" 
              value={profile.address} 
              onChange={handleChange} 
              disabled={!isEditing} 
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: isEditing ? 'var(--bg)' : 'transparent', color: 'var(--text)' }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
