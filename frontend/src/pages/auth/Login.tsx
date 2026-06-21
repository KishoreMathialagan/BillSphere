import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Button } from '../../components/atoms/Button';
import { Input } from '../../components/atoms/Input';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const response = await api.post('/auth/login', { email, password });
        login(response.data.access_token, response.data.refresh_token);
        navigate('/app/dashboard');
      } else {
        const response = await api.post('/auth/register', {
          first_name: firstName,
          last_name: lastName,
          business_name: businessName,
          email,
          password
        });
        login(response.data.access_token, response.data.refresh_token);
        navigate('/app/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: 'var(--color-sand)', fontFamily: 'var(--font-body)' }}>
      
      {/* Left Column: Form */}
      <div style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'var(--space-10)', maxWidth: '600px', margin: '0 auto', zIndex: 2 }}>
        
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-10)' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--color-cyprus)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-sand)', fontWeight: 'bold', fontFamily: 'var(--font-heading)', fontSize: '12px' }}>
              VM
            </div>
            <span className="heading-3" style={{ margin: 0 }}>Vendor Mind.</span>
          </div>

          <p className="body-sm" style={{ color: 'var(--color-night-40)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Start for free</p>
          <h1 className="display-text" style={{ color: 'var(--color-cyprus)', margin: 'var(--space-2) 0', fontSize: '3rem' }}>
            {isLogin ? 'Welcome back.' : 'Create new account.'}
          </h1>
          
          <div className="body" style={{ color: 'var(--color-night-60)', marginTop: 'var(--space-4)' }}>
            {isLogin ? "Don't have an account? " : "Already A Member? "}
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)}
              style={{ background: 'none', border: 'none', color: 'var(--color-cyprus)', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: 'var(--color-danger)', color: 'white', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: '14px', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {!isLogin && (
            <>
              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <div style={{ flex: 1 }}>
                  <Input 
                    label="First name"
                    value={firstName} 
                    onChange={e => setFirstName(e.target.value)} 
                    required 
                    placeholder="John"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Input 
                    label="Last name"
                    value={lastName} 
                    onChange={e => setLastName(e.target.value)} 
                    required 
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <Input 
                label="Business / Company Name"
                value={businessName} 
                onChange={e => setBusinessName(e.target.value)} 
                required 
                placeholder="My Awesome Shop"
              />
            </>
          )}

          <Input 
            label="Email"
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            placeholder="example@example.com"
          />

          <div style={{ position: 'relative' }}>
            <Input 
              label="Password"
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '16px', top: '40px', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
            <Button type="button" variant="ghost" style={{ flex: 1, padding: '16px' }}>
              Sign in with Google
            </Button>
            <Button type="submit" variant="filled" style={{ flex: 1, padding: '16px' }} disabled={isLoading}>
              {isLoading ? 'Processing...' : (isLogin ? 'Log In' : 'Create account')}
            </Button>
          </div>
        </form>
      </div>

      {/* Right Column: Visual background */}
      <div style={{ 
        flex: '1 1 50%', 
        position: 'relative', 
        overflow: 'hidden', 
        background: 'var(--color-cyprus-deep)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }} className="hidden lg:flex">
        
        {/* Abstract Neumorphic/Glassmorphic composition */}
        <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0, 71, 65, 0.4), rgba(0,0,0,0))', filter: 'blur(40px)', top: '-100px', right: '-100px' }}></div>
        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(240, 237, 228, 0.1), rgba(0,0,0,0))', filter: 'blur(20px)', bottom: '10%', left: '-50px' }}></div>
        
        <div style={{ 
          width: '320px', 
          height: '420px', 
          background: 'rgba(255,255,255,0.05)', 
          backdropFilter: 'blur(20px)', 
          borderRadius: '32px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          textAlign: 'center',
          zIndex: 1
        }}>
          <div style={{ width: '80px', height: '80px', background: 'var(--color-sand)', borderRadius: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 24px rgba(0,0,0,0.3)' }}>
            <span style={{ fontSize: '32px' }}>✨</span>
          </div>
          <h3 className="heading-3" style={{ color: 'var(--color-sand)', marginBottom: '16px' }}>Manage retail efficiently</h3>
          <p className="body" style={{ color: 'rgba(240,237,228,0.7)' }}>The all-in-one OS for modern retail businesses, designed with simplicity and power in mind.</p>
        </div>

      </div>

      <style>{`
        @media (max-width: 1024px) {
          .hidden.lg\\:flex {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
