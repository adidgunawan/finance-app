import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/chart-of-accounts', label: 'Accounts' },
  { path: '/transactions', label: 'Transactions' },
  { path: '/contacts', label: 'Contacts' },
];

export function MobileNav() {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="mobile-nav">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`mobile-nav-item ${location.pathname === item.path ? 'active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
      <button
        onClick={handleLogout}
        className="mobile-nav-item"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
          fontSize: 'inherit',
          fontFamily: 'inherit',
        }}
      >
        Logout
      </button>
    </nav>
  );
}

