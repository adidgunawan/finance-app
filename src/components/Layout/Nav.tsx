import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/chart-of-accounts', label: 'Chart of Accounts' },
  { path: '/transactions', label: 'Transactions' },
  { path: '/contacts', label: 'Contacts' },
];

export function Nav() {
  const location = useLocation();

  return (
    <nav className="nav">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

