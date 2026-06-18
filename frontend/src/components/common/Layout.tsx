import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/app/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/app/pos', label: 'POS Terminal', icon: '🖥️' },
    { path: '/app/products', label: 'Products', icon: '📦' },
    { path: '/app/categories', label: 'Categories', icon: '📁' },
    { path: '/app/inventory', label: 'Stock & Alerts', icon: '📉' },
    { path: '/app/purchases', label: 'Purchases', icon: '🛒' },
    { path: '/app/vendors/ocr', label: 'AI Invoice Scanner', icon: '📄' },
    { path: '/app/customers', label: 'Customers', icon: '👥' },
    { path: '/app/vendors', label: 'Vendors', icon: '🏢' },
    { path: '/app/branches', label: 'Branches', icon: '🏪' },
    { path: '/app/transfers', label: 'Transfers', icon: '🚚' },
    { path: '/app/reports/branches', label: 'Branch Reports', icon: '📈' },
    { path: '/app/accounting/accounts', label: 'Chart of Accounts', icon: '📓' },
    { path: '/app/accounting/journals', label: 'Journal Entries', icon: '✍️' },
    { path: '/app/accounting/reports/pnl', label: 'Profit & Loss', icon: '💰' },
    { path: '/app/accounting/reports/balance-sheet', label: 'Balance Sheet', icon: '⚖️' },
    { path: '/app/reports/gst', label: 'GST Reports', icon: '🧾' },
    { path: '/app/forecasting', label: 'Forecasting', icon: '📈' },
    { path: '/app/assistant', label: 'AI Advisor', icon: '✨' },
    { path: '/app/settings/ai', label: 'AI Configuration', icon: '🧠' },
    { path: '/app/settings/hardware', label: 'Hardware Settings', icon: '⚙️' },
  ];

  // Get current page title
  const currentItem = menuItems.find(item => location.pathname.startsWith(item.path));
  const pageTitle = currentItem ? currentItem.label : 'Management';

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: 'var(--sans)',
      textAlign: 'left',
    }}>
      {/* Sidebar for Desktop */}
      <aside style={{
        width: '260px',
        background: 'var(--code-bg)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
        boxSizing: 'border-box',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 10,
        transition: 'transform 0.3s ease',
        transform: 'translateX(0)',
      } as any} className="desktop-sidebar">
        <div>
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '40px',
            padding: '0 8px'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent) 0%, #ec4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: 'white',
              fontSize: '20px',
              boxShadow: '0 4px 12px var(--accent-bg)'
            }}>
              B
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, var(--text-h) 30%, var(--accent) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px'
              }}>Bill Sphere</h2>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6 }}>Retail OS</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '15px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--text-h)' : 'var(--text)',
                  backgroundColor: isActive ? 'var(--accent-bg)' : 'transparent',
                  border: isActive ? '1px solid var(--accent-border)' : '1px solid transparent',
                  transition: 'all 0.2s ease',
                })}
                onClick={() => setIsMobileOpen(false)}
              >
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Profile & Actions */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {user && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              padding: '0 8px'
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-h)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }} title={user.sub}>
                {user.sub}
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{
                  fontSize: '10px',
                  background: 'var(--accent-bg)',
                  color: 'var(--accent)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>
                  {user.role}
                </span>
                <span style={{ fontSize: '11px', opacity: 0.6 }}>
                  Tenant: {user.tenant_id}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              width: '100%',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-h)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-bg)';
              e.currentTarget.style.borderColor = 'var(--accent-border)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar overlay & Drawer */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 9,
          }}
        />
      )}

      {/* Main Content Pane */}
      <div style={{
        flexGrow: 1,
        marginLeft: '260px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }} className="main-content-pane">
        
        {/* Header */}
        <header style={{
          height: '70px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 8,
        }}>
          {/* Mobile hamburger menu */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: 'var(--text-h)',
              cursor: 'pointer',
            }}
            className="hamburger-btn"
          >
            ☰
          </button>

          <h1 style={{
            fontSize: '22px',
            margin: 0,
            fontWeight: 600,
            letterSpacing: '-0.5px'
          }}>{pageTitle}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              fontSize: '13px',
              padding: '6px 12px',
              background: 'var(--code-bg)',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-h)'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
              <span>Active Tenant: <strong>{user?.tenant_id}</strong></span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main style={{
          flexGrow: 1,
          padding: '32px',
          boxSizing: 'border-box',
          overflowY: 'auto'
        }}>
          <Outlet />
        </main>
      </div>

      {/* Global CSS Inject to support responsive media queries and class toggles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .desktop-sidebar {
            transform: translateX(${isMobileOpen ? '0' : '-100%'}) !important;
            position: fixed !important;
            height: 100vh !important;
            width: 260px !important;
          }
          .main-content-pane {
            margin-left: 0 !important;
          }
          .hamburger-btn {
            display: block !important;
          }
        }
      `}} />
    </div>
  );
};

export default Layout;
