import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { NeuoCard } from '../../components/molecules/NeuoCard';
import { Button } from '../../components/atoms/Button';
import { Input } from '../../components/atoms/Input';
import { Badge } from '../../components/atoms/Badge';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="heading-2">My Profile</h2>
          <p className="body" style={{ color: 'var(--color-night-60)' }}>Manage your personal details and business identity.</p>
        </div>
        <Button 
          variant={isEditing ? 'filled' : 'neuo'} 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
        >
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
        
        {/* Left Column: Avatar/Logo & Role */}
        <NeuoCard style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 'var(--space-6)' }}>
          <div style={{ position: 'relative', width: '160px', height: '160px' }}>
            <div style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: '50%', 
              background: 'var(--color-sand)', 
              boxShadow: 'var(--shadow-neuo-sm)',
              border: '4px solid var(--color-sand)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {profile.logo_url ? (
                <img src={profile.logo_url} alt="Brand Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: 'var(--color-cyprus)', opacity: 0.5, fontSize: '64px' }}>🏢</span>
              )}
              
              {isEditing && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    background: 'rgba(0,0,0,0.6)', 
                    color: 'white', 
                    padding: '12px 0', 
                    cursor: 'pointer', 
                    fontFamily: 'var(--font-heading)',
                    fontSize: '12px', 
                    fontWeight: 600,
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  Upload Logo
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" style={{ display: 'none' }} />
            </div>
          </div>
          
          <div>
            <h3 className="heading-3" style={{ margin: '0 0 var(--space-2)' }}>{profile.business_name || 'Your Brand'}</h3>
            <Badge variant="cyprus">{profile.role || 'Admin'}</Badge>
          </div>
        </NeuoCard>

        {/* Right Column: Forms */}
        <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          
          <NeuoCard>
            <h3 className="heading-3" style={{ marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-sand-dark)', paddingBottom: 'var(--space-4)' }}>Personal Information</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <Input 
                label="First Name"
                name="first_name" 
                value={profile.first_name} 
                onChange={handleChange} 
                disabled={!isEditing} 
              />
              <Input 
                label="Last Name"
                name="last_name" 
                value={profile.last_name} 
                onChange={handleChange} 
                disabled={!isEditing} 
              />
              <Input 
                label="Email Address"
                name="email" 
                type="email"
                value={profile.email} 
                onChange={handleChange} 
                disabled={!isEditing} 
              />
              <Input 
                label="Phone Number"
                name="phone" 
                type="tel"
                value={profile.phone} 
                onChange={handleChange} 
                disabled={!isEditing} 
              />
            </div>
          </NeuoCard>

          <NeuoCard>
            <h3 className="heading-3" style={{ marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-sand-dark)', paddingBottom: 'var(--space-4)' }}>Shop & Branch Details</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <Input 
                label="Shop / Brand Name"
                name="business_name" 
                value={profile.business_name} 
                onChange={handleChange} 
                disabled={!isEditing} 
              />
              <Input 
                label="Branch Name"
                name="branch_name" 
                value={profile.branch_name} 
                onChange={handleChange} 
                disabled={!isEditing} 
              />
              <div style={{ gridColumn: '1 / -1' }}>
                <Input 
                  label="Branch Address"
                  name="address" 
                  value={profile.address} 
                  onChange={handleChange} 
                  disabled={!isEditing} 
                />
              </div>
            </div>
          </NeuoCard>

        </div>

      </div>
    </div>
  );
};

export default Profile;
