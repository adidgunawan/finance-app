import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiBarChart2, FiRepeat, FiUsers, FiLogOut } from 'react-icons/fi';

const navItems = [
  { path: '/chart-of-accounts', label: 'Chart of Accounts', icon: FiBarChart2 },
  { path: '/transactions', label: 'Transactions', icon: FiRepeat },
  { path: '/contacts', label: 'Contacts', icon: FiUsers },
];

export function Nav() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="nav">
      <div>
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <IconComponent style={{ marginRight: '8px', fontSize: '16px' }} />
              {item.label}
            </Link>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-color)',
          position: 'relative',
        }}
        ref={menuRef}
      >
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="nav-item"
          style={{
            width: '100%',
            textAlign: 'left',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px 8px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: '600',
              flexShrink: 0,
            }}
          >
            {getUserInitials()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: '500', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '1.3' }}>
              {getUserDisplayName()}
            </div>
            {user?.email && (
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '1.2' }}>
                {user.email}
              </div>
            )}
          </div>
        </button>
        {showUserMenu && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              right: 0,
              marginBottom: '8px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              zIndex: 1000,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <FiLogOut style={{ fontSize: '16px' }} />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

