import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useHomeData } from './hooks/useHomeData';
import { Dashboard } from './Dashboard';
import { formatCurrency } from '../../lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function Home() {
  // Show Dashboard on desktop, mobile view on mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Desktop: Show comprehensive dashboard
  if (!isMobile) {
    return <Dashboard />;
  }

  // Mobile: Show simplified mobile view
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const {
    monthlySpent,
    monthlySpentChange,
    monthlySpentPercent,
    monthlyIncome,
    monthlyIncomeChange,
    monthlyIncomePercent,
    spentTrendData,
    incomeTrendData,
    wallets,
    loading,
  } = useHomeData(selectedMonth);

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container pb-[calc(56px+var(--space-2xl))] relative">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/5 via-purple-50/5 to-green-50/5 -z-10 pointer-events-none" />

      {/* Month Selector */}
      <div className="flex justify-between items-center mb-4 py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const newDate = new Date(selectedMonth);
            newDate.setMonth(newDate.getMonth() - 1);
            setSelectedMonth(newDate);
          }}
          className="rounded-full w-9 h-9"
        >
          <FiChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-base font-semibold text-foreground">
          {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const newDate = new Date(selectedMonth);
            newDate.setMonth(newDate.getMonth() + 1);
            setSelectedMonth(newDate);
          }}
          className="rounded-full w-9 h-9"
        >
          <FiChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Wallet Account Carousel */}
      {wallets.length > 0 && (
        <div className="mb-5">
          <div className="flex gap-3 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory -webkit-overflow-scrolling-touch">
            {wallets.map((wallet, index) => (
              <div
                key={wallet.id}
                className="relative p-5 rounded-2xl min-w-[320px] max-w-[320px] h-[200px] snap-start text-white cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${getWalletGradient(index)})`,
                  animation: `cardEntrance 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s backwards`,
                }}
                onClick={() => navigate('/chart-of-accounts')}
              >
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-[150px] h-[150px] rounded-full bg-white/10" />
                <div className="absolute -bottom-15 -left-15 w-[180px] h-[180px] rounded-full bg-black/10" />

                {/* Top section */}
                <div className="relative z-10">
                  <p className="text-[10px] opacity-80 mb-2 uppercase tracking-wider font-medium">
                    {wallet.name}
                  </p>
                  <div className="text-[22px] font-semibold tracking-wider font-mono">
                    •••• •••• •••• {String(wallet.balance).slice(-4).padStart(4, '0')}
                  </div>
                </div>

                {/* Bottom section */}
                <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end z-10">
                  <div>
                    <div className="flex gap-4 mb-2">
                      <div>
                        <p className="text-[9px] opacity-70 uppercase tracking-wide">
                          Balance
                        </p>
                        <p className="text-[13px] font-semibold mt-0.5">
                          {formatCurrency(wallet.balance, 'IDR')}
                        </p>
                      </div>
                    </div>
                    <p className="text-[9px] opacity-70">
                      {wallet.percentOfTotal.toFixed(1)}% of total
                    </p>
                  </div>

                  {/* Card logo (Mastercard-style circles) */}
                  <div className="flex items-center -space-x-3">
                    <div className="w-8 h-8 rounded-full bg-[rgba(255,95,95,0.9)]" />
                    <div className="w-8 h-8 rounded-full bg-[rgba(255,180,60,0.9)]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons - Responsive */}
      <div className="grid grid-cols-3 gap-3 mb-6 md:flex md:justify-center md:gap-4 lg:gap-6">
        <Button
          onClick={() => navigate('/transactions/income/new')}
          variant="outline"
          className="flex flex-col items-center gap-1.5 h-auto py-4 px-3 md:px-6 md:min-w-[140px] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
          style={{
            animation: 'cardEntrance 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s backwards',
          }}
        >
          <img src="/icons/income-3d.png" alt="Income" className="w-8 h-8" />
          <span className="text-sm font-semibold">Income</span>
        </Button>
        <Button
          onClick={() => navigate('/transactions/expense/new')}
          variant="outline"
          className="flex flex-col items-center gap-1.5 h-auto py-4 px-3 md:px-6 md:min-w-[140px] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
          style={{
            animation: 'cardEntrance 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s backwards',
          }}
        >
          <img src="/icons/expense-3d.png" alt="Expense" className="w-8 h-8" />
          <span className="text-sm font-semibold">Expense</span>
        </Button>
        <Button
          onClick={() => navigate('/transactions/transfer/new')}
          variant="outline"
          className="flex flex-col items-center gap-1.5 h-auto py-4 px-3 md:px-6 md:min-w-[140px] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
          style={{
            animation: 'cardEntrance 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s backwards',
          }}
        >
          <img src="/icons/balance-3d.png" alt="Transfer" className="w-8 h-8" />
          <span className="text-sm font-semibold">Transfer</span>
        </Button>
      </div>

      {/* Monthly Spent Chart */}
      <Card
        className="mb-4 backdrop-blur-md bg-white/60 border-white/30 shadow-lg"
        style={{
          animation: 'cardEntrance 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s backwards',
        }}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground mb-1">
            Monthly Spent
          </CardTitle>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold">
              {formatCurrency(monthlySpent, 'IDR')}
            </h2>
            <span
              className={cn(
                'text-xs font-semibold flex items-center gap-1',
                monthlySpentChange >= 0 ? 'text-red-500' : 'text-green-500'
              )}
            >
              {monthlySpentChange >= 0 ? '+' : ''}{formatCurrency(Math.abs(monthlySpentChange), 'IDR')}
            </span>
            <span
              className={cn(
                'px-2 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-0.5',
                monthlySpentChange >= 0
                  ? 'bg-red-500/10 text-red-500'
                  : 'bg-green-500/10 text-green-500'
              )}
            >
              {monthlySpentChange >= 0 ? '+' : ''}{monthlySpentPercent.toFixed(1)}%
              {monthlySpentChange >= 0 ? '↗' : '↘'}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={spentTrendData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFD54F" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#FFF9C4" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value: number) => formatCurrency(value, 'IDR')}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#FFD54F"
                strokeWidth={2}
                fill="url(#colorSpent)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Income Chart */}
      <Card
        className="mb-4 backdrop-blur-md bg-white/60 border-white/30 shadow-lg"
        style={{
          animation: 'cardEntrance 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.5s backwards',
        }}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground mb-1">
            Monthly Income
          </CardTitle>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold">
              {formatCurrency(monthlyIncome, 'IDR')}
            </h2>
            <span
              className={cn(
                'text-xs font-semibold flex items-center gap-1',
                monthlyIncomeChange >= 0 ? 'text-green-500' : 'text-red-500'
              )}
            >
              {monthlyIncomeChange >= 0 ? '+' : ''}{formatCurrency(Math.abs(monthlyIncomeChange), 'IDR')}
            </span>
            <span
              className={cn(
                'px-2 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-0.5',
                monthlyIncomeChange >= 0
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-red-500/10 text-red-500'
              )}
            >
              {monthlyIncomeChange >= 0 ? '+' : ''}{monthlyIncomePercent.toFixed(1)}%
              {monthlyIncomeChange >= 0 ? '↗' : '↘'}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={incomeTrendData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#81C784" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#C8E6C9" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value: number) => formatCurrency(value, 'IDR')}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#81C784"
                strokeWidth={2}
                fill="url(#colorIncome)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to get gradient colors for wallet cards
function getWalletGradient(index: number): string {
    const gradients = [
        'rgba(102, 126, 234, 0.8), rgba(118, 75, 162, 0.8)',
        'rgba(250, 112, 154, 0.8), rgba(254, 225, 64, 0.8)',
        'rgba(79, 172, 254, 0.8), rgba(0, 242, 254, 0.8)',
        'rgba(67, 233, 123, 0.8), rgba(56, 249, 215, 0.8)',
        'rgba(240, 147, 251, 0.8), rgba(245, 87, 108, 0.8)',
    ];
    return gradients[index % gradients.length];
}
