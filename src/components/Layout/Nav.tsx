import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/chart-of-accounts', label: 'Chart of Accounts' },
  { path: '/transactions', label: 'Transactions' },
  { path: '/contacts', label: 'Contacts' },
];

export function Nav() {
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="nav">
      <div>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
        <button
          onClick={handleLogout}
          className="nav-item"
          style={{
            width: '100%',
            textAlign: 'left',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px 8px',
            color: 'var(--text-primary)',
            fontSize: '14px',
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

