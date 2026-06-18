import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { User, Mail, Building, Eye, EyeOff } from 'lucide-react';
import './Login.css';

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
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="logo-circle"></div>
            <span>Bill Sphere.</span>
          </div>
          <nav className="auth-nav">
            <a href="#">Home</a>
            <a href="#">Join</a>
          </nav>
        </div>

        <div className="auth-content">
          <p className="auth-subtitle">START FOR FREE</p>
          <h1 className="auth-title">
            {isLogin ? 'Welcome back.' : 'Create new account.'}
          </h1>
          <p className="auth-switch">
            {isLogin ? "Don't have an account? " : "Already A Member? "}
            <button 
              className="auth-switch-btn"
              type="button" 
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <>
                <div className="form-row">
                  <div className="input-group">
                    <label>First name</label>
                    <div className="input-wrapper">
                      <input 
                        type="text" 
                        value={firstName} 
                        onChange={e => setFirstName(e.target.value)} 
                        required 
                        placeholder="John"
                      />
                      <User size={18} className="input-icon" />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Last name</label>
                    <div className="input-wrapper">
                      <input 
                        type="text" 
                        value={lastName} 
                        onChange={e => setLastName(e.target.value)} 
                        required 
                        placeholder="Doe"
                      />
                      <User size={18} className="input-icon" />
                    </div>
                  </div>
                </div>
                
                <div className="input-group">
                  <label>Business / Company Name</label>
                  <div className="input-wrapper">
                    <input 
                      type="text" 
                      value={businessName} 
                      onChange={e => setBusinessName(e.target.value)} 
                      required 
                      placeholder="My Awesome Shop"
                    />
                    <Building size={18} className="input-icon" />
                  </div>
                </div>
              </>
            )}

            <div className="input-group">
              <label>Email</label>
              <div className="input-wrapper">
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  placeholder="john.doe@example.com"
                />
                <Mail size={18} className="input-icon" />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper focused-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  className="icon-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} className="input-icon" /> : <Eye size={18} className="input-icon" />}
                </button>
              </div>
            </div>

            <div className="auth-actions">
              <button type="button" className="btn-secondary">
                Change method
              </button>
              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? 'Processing...' : (isLogin ? 'Log In' : 'Create account')}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="auth-right">
        {/* Background handled by CSS */}
      </div>
    </div>
  );
};

export default Login;
