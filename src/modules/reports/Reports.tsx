import { Link, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { BalanceSheet } from './BalanceSheet';
import { NetWorth } from './NetWorth';

export function Reports() {
  const location = useLocation();
  const isNetWorth = location.pathname === '/reports/net-worth';

  return (
    <div className="container">
      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <Link
          to="/reports"
          style={{
            padding: '12px 16px',
            textDecoration: 'none',
            color: isNetWorth ? 'var(--text-secondary)' : 'var(--text-primary)',
            borderBottom: isNetWorth ? 'none' : '2px solid var(--text-primary)',
            fontWeight: isNetWorth ? '400' : '600',
            fontSize: '14px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (isNetWorth) {
              e.currentTarget.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (isNetWorth) {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
        >
          Balance Sheet
        </Link>
        <Link
          to="/reports/net-worth"
          style={{
            padding: '12px 16px',
            textDecoration: 'none',
            color: isNetWorth ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: isNetWorth ? '2px solid var(--text-primary)' : 'none',
            fontWeight: isNetWorth ? '600' : '400',
            fontSize: '14px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isNetWorth) {
              e.currentTarget.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isNetWorth) {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
        >
          Net Worth
        </Link>
      </div>

      {/* Routes */}
      <Routes>
        <Route index element={<BalanceSheet />} />
        <Route path="net-worth" element={<NetWorth />} />
        <Route path="*" element={<Navigate to="/reports" replace />} />
      </Routes>
    </div>
  );
}
