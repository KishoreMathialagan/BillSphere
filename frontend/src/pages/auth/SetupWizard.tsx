import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const SetupWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    business_name: '',
    gst_number: '',
    legal_name: '',
    state: '',
    branch_name: '',
    branch_address: '',
    owner_email: '',
    owner_password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/setup/', formData);
      navigate('/login');
    } catch (err) {
      alert("Setup failed. Please check the data and try again.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
      <h1>Business Setup Wizard</h1>
      <p>Step {step} of 4</p>
      
      <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }} style={{ width: '300px', display: 'flex', flexDirection: 'column' }}>
        {step === 1 && (
          <>
            <h3>1. Business Information</h3>
            <label>Business Name</label>
            <input name="business_name" value={formData.business_name} onChange={handleChange} required style={{ marginBottom: '10px', padding: '8px' }} />
            <label>Business State</label>
            <input name="state" value={formData.state} onChange={handleChange} required placeholder="e.g. Maharashtra" style={{ marginBottom: '10px', padding: '8px' }} />
          </>
        )}

        {step === 2 && (
          <>
            <h3>2. GST Information</h3>
            <label>GST Number (Optional)</label>
            <input name="gst_number" value={formData.gst_number} onChange={handleChange} style={{ marginBottom: '10px', padding: '8px' }} />
            <label>Legal Name (Optional)</label>
            <input name="legal_name" value={formData.legal_name} onChange={handleChange} style={{ marginBottom: '10px', padding: '8px' }} />
          </>
        )}

        {step === 3 && (
          <>
            <h3>3. Branch Information</h3>
            <label>Branch Name</label>
            <input name="branch_name" value={formData.branch_name} onChange={handleChange} required style={{ marginBottom: '10px', padding: '8px' }} />
            <label>Branch Address</label>
            <input name="branch_address" value={formData.branch_address} onChange={handleChange} style={{ marginBottom: '10px', padding: '8px' }} />
          </>
        )}

        {step === 4 && (
          <>
            <h3>4. Admin User Info</h3>
            <label>Email</label>
            <input type="email" name="owner_email" value={formData.owner_email} onChange={handleChange} required style={{ marginBottom: '10px', padding: '8px' }} />
            <label>Password</label>
            <input type="password" name="owner_password" value={formData.owner_password} onChange={handleChange} required style={{ marginBottom: '10px', padding: '8px' }} />
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          {step > 1 && <button type="button" onClick={prevStep} style={{ padding: '8px' }}>Back</button>}
          <button type="submit" style={{ padding: '8px', backgroundColor: '#007bff', color: 'white', border: 'none' }}>
            {step === 4 ? 'Finish Setup' : 'Next'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SetupWizard;
