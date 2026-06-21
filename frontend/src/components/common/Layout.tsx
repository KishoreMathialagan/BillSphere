import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../atoms/Input';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/app/dashboard', label: 'Dashboard', icon: '📊', shortLabel: 'Home' },
    { path: '/app/pos', label: 'POS Terminal', icon: '🖥️', shortLabel: 'POS' },
    { path: '/app/products', label: 'Products', icon: '📦', shortLabel: 'Products' },
    { path: '/app/categories', label: 'Categories', icon: '📁', shortLabel: 'Category' },
    { path: '/app/inventory', label: 'Stock & Alerts', icon: '📉', shortLabel: 'Stock' },
    { path: '/app/purchases', label: 'Purchases', icon: '🛒', shortLabel: 'Buy' },
    { path: '/app/vendors/ocr', label: 'AI Invoice Scanner', icon: '📄', shortLabel: 'Scan' },
    { path: '/app/customers', label: 'Customers', icon: '👥', shortLabel: 'Users' },
    { path: '/app/vendors', label: 'Vendors', icon: '🏢', shortLabel: 'Vendor' },
    { path: '/app/settings/profile', label: 'My Profile', icon: '👤', shortLabel: 'Profile' },
    { path: '/app/assistant', label: 'AI Advisor', icon: '✨', shortLabel: 'AI' },
  ];

  // Mobile nav shows top 5 priority
  const mobileNavItems = [
    menuItems[0], // Dashboard
    menuItems[1], // POS
    menuItems[2], // Products
    menuItems[7], // Customers
    menuItems[10], // AI
  ];

  return (
    <div className="layout-root">
      <style>{`
        .layout-root {
          display: flex;
          min-height: 100vh;
          background: var(--color-sand);
          color: var(--color-night);
        }
        
        .desktop-sidebar {
          width: var(--sidebar-width);
          background: var(--color-sand);
          border-right: 1px solid var(--color-sand-dark);
          display: flex;
          flex-direction: column;
          padding: var(--space-6) var(--space-4);
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: var(--z-sidebar);
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-8);
          padding: 0 var(--space-2);
        }

        .brand-icon {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          background: var(--color-cyprus);
          color: var(--color-sand);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 16px;
          box-shadow: 2px 2px 5px rgba(0,71,65,0.3);
        }

        .brand-text-wrapper {
          display: flex;
          flex-direction: column;
        }

        .brand-title {
          font-family: var(--font-display);
          font-size: 24px;
          color: var(--color-cyprus);
          line-height: 1;
          font-weight: 600;
        }

        .brand-subtitle {
          font-family: var(--font-heading);
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--color-night-40);
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: 10px var(--space-4);
          border-radius: var(--radius-md);
          text-decoration: none;
          font-family: var(--font-heading);
          font-size: 14px;
          font-weight: 500;
          color: rgba(33, 33, 33, 0.55);
          transition: all 180ms ease;
          margin-bottom: var(--space-1);
        }

        .nav-item:hover {
          box-shadow: var(--shadow-neuo-sm);
          color: var(--color-cyprus);
        }

        .nav-item.active {
          box-shadow: var(--shadow-neuo-inset);
          color: var(--color-cyprus);
          font-weight: 700;
        }

        .sidebar-bottom {
          margin-top: auto;
          border-top: 1px solid var(--color-sand-dark);
          padding-top: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .main-content {
          flex-grow: 1;
          margin-left: var(--sidebar-width);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .header-bar {
          height: var(--header-height);
          position: sticky;
          top: 0;
          z-index: var(--z-sticky);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--space-8);
          background: var(--color-sand);
          transition: box-shadow 0.2s ease;
        }

        .header-scrolled {
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }

        .mobile-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom));
          padding-bottom: env(safe-area-inset-bottom);
          background: var(--color-sand);
          box-shadow: 0 -6px 20px rgba(0,71,65,0.08), 0 -1px 0 rgba(0,71,65,0.08);
          z-index: var(--z-sticky);
          justify-content: space-around;
          align-items: center;
        }

        .mobile-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: var(--color-night-40);
          gap: 4px;
          flex: 1;
          position: relative;
        }
        
        .mobile-nav-item span.icon {
          font-size: 20px;
        }

        .mobile-nav-item span.label {
          font-family: var(--font-heading);
          font-size: 10px;
        }

        .mobile-nav-item.active {
          color: var(--color-cyprus);
        }

        .mobile-nav-item.active span.label {
          font-weight: 700;
        }
        
        .mobile-nav-item.active::before {
          content: '';
          position: absolute;
          top: -8px;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--color-cyprus);
        }

        @media (max-width: 1024px) {
          .desktop-sidebar {
            display: none;
          }
          .main-content {
            margin-left: 0;
            padding-bottom: var(--bottom-nav-height);
          }
          .mobile-bottom-nav {
            display: flex;
          }
          .header-bar {
            padding: 0 var(--space-4);
          }
        }
      `}</style>

      {/* Desktop Sidebar */}
      <aside className="desktop-sidebar">
        <div className="brand-logo">
          <div className="brand-icon">VM</div>
          <div className="brand-text-wrapper">
            <span className="brand-title">Vendor Mind</span>
            <span className="brand-subtitle">Retail OS</span>
          </div>
        </div>

        <nav style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '8px' }}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          {user && (
            <div style={{ padding: '0 var(--space-2)' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 600, color: 'var(--color-night)' }}>
                {user.sub}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-night-40)', marginTop: '2px' }}>
                Tenant: {user.tenant_id} • {user.role}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="nav-item"
            style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <span style={{ fontSize: '18px' }}>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        {mobileNavItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.shortLabel}</span>
          </NavLink>
        ))}
      </nav>

      {/* Main Content Area */}
      <div className="main-content">
        <header className="header-bar" id="app-header">
          {/* Header left: Search for Desktop */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div style={{ maxWidth: '400px', width: '100%' }} className="hidden lg:block">
              <Input 
                placeholder="Search products, invoices, or customers..." 
                leftIcon={<span>🔍</span>}
                style={{ borderRadius: 'var(--radius-full)' }}
              />
            </div>
          </div>
          
          {/* Header right: Notifications & User profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <button className="icon-btn" style={{ background: 'transparent', boxShadow: 'none' }}>🔔</button>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-cyprus)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
              {user?.sub?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        <main style={{ padding: 'var(--space-6) var(--space-8)', flexGrow: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
