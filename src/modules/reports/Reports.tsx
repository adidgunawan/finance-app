import { Link, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BalanceSheet } from './BalanceSheet';
import { NetWorth } from './NetWorth';

export function Reports() {
  const location = useLocation();
  const isNetWorth = location.pathname === '/reports/net-worth';

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto whitespace-nowrap border-b border-border">
        <Link
          to="/reports"
          className={cn(
            'inline-flex items-center justify-center px-4 py-2 text-sm transition-colors',
            isNetWorth
              ? 'text-muted-foreground hover:text-foreground'
              : 'border-b-2 border-foreground font-semibold text-foreground'
          )}
        >
          Balance Sheet
        </Link>
        <Link
          to="/reports/net-worth"
          className={cn(
            'inline-flex items-center justify-center px-4 py-2 text-sm transition-colors',
            isNetWorth
              ? 'border-b-2 border-foreground font-semibold text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
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
