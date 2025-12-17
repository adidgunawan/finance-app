import { useState } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts';
import { FiChevronLeft, FiChevronRight, FiTrendingUp, FiTrendingDown, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { useDashboardData } from './hooks/useDashboardData';
import { formatCurrency } from '../../lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const data = useDashboardData(selectedMonth);

  if (data.loading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const handlePreviousMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedMonth(newDate);
  };

  const monthLabel = selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 pb-8">
      {/* Header with Month Selector */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive financial insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
            className="h-9 w-9"
          >
            <FiChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[180px] text-center">
            <span className="text-sm font-semibold">{monthLabel}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            className="h-9 w-9"
            disabled={selectedMonth >= new Date()}
          >
            <FiChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Income</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {formatCurrency(data.currentMonthIncome, 'IDR')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              {data.incomeChange >= 0 ? (
                <FiTrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <FiTrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={cn(
                "font-semibold",
                data.incomeChange >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {data.incomeChange >= 0 ? '+' : ''}{data.incomeChangePercent.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">
                vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {formatCurrency(data.currentMonthExpense, 'IDR')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              {data.expenseChange >= 0 ? (
                <FiTrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <FiTrendingDown className="h-4 w-4 text-green-500" />
              )}
              <span className={cn(
                "font-semibold",
                data.expenseChange >= 0 ? "text-red-500" : "text-green-500"
              )}>
                {data.expenseChange >= 0 ? '+' : ''}{data.expenseChangePercent.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">
                vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Net Cash Flow</CardDescription>
            <CardTitle className={cn(
              "text-2xl font-bold",
              data.currentMonthNet >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatCurrency(data.currentMonthNet, 'IDR')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              {data.netChange >= 0 ? (
                <FiArrowUp className="h-4 w-4 text-green-500" />
              ) : (
                <FiArrowDown className="h-4 w-4 text-red-500" />
              )}
              <span className={cn(
                "font-semibold",
                data.netChange >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {data.netChange >= 0 ? '+' : ''}{formatCurrency(Math.abs(data.netChange), 'IDR')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Savings Rate</CardDescription>
            <CardTitle className={cn(
              "text-2xl font-bold",
              data.currentMonthSavingsRate >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {data.currentMonthSavingsRate.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {data.currentMonthIncome > 0 
                ? `${formatCurrency(data.currentMonthNet, 'IDR')} saved`
                : 'No income data'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>6-Month Financial Trends</CardTitle>
          <CardDescription>Income, Expenses, and Net Cash Flow over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.monthlyTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis 
                stroke="#6b7280" 
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toString();
                }} 
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value, 'IDR')}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Area type="monotone" dataKey="income" stroke="#10B981" fillOpacity={1} fill="url(#colorIncome)" name="Income" />
              <Area type="monotone" dataKey="expense" stroke="#EF4444" fillOpacity={1} fill="url(#colorExpense)" name="Expenses" />
              <Area type="monotone" dataKey="net" stroke="#3B82F6" fillOpacity={1} fill="url(#colorNet)" name="Net" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Row 1: Income vs Expenses & Category Breakdowns */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Income vs Expenses Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Current month comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { name: 'Income', amount: data.currentMonthIncome },
                { name: 'Expenses', amount: data.currentMonthExpense },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toString();
                }} />
                <Tooltip formatter={(value: number) => formatCurrency(value, 'IDR')} />
                <Bar dataKey="amount" fill="#3B82F6" radius={[8, 8, 0, 0]}>
                  {[
                    { name: 'Income', amount: data.currentMonthIncome },
                    { name: 'Expenses', amount: data.currentMonthExpense },
                  ].map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Categories Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>Breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            {data.expenseCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.expenseCategories as any}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) =>
                      `${props?.name ?? ''}: ${((props?.percent ?? 0) * 100).toFixed(1)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {data.expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value, 'IDR')} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No expense data for this month
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Daily Cash Flow & Account Balances */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Daily Cash Flow */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Cash Flow</CardTitle>
            <CardDescription>Income and expenses throughout {monthLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.dailyCashFlow} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDailyIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorDailyExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval="preserveStartEnd"
                />
                <YAxis tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toString();
                }} />
                <Tooltip formatter={(value: number) => formatCurrency(value, 'IDR')} />
                <Legend />
                <Area type="monotone" dataKey="income" stroke="#10B981" fillOpacity={1} fill="url(#colorDailyIncome)" name="Income" />
                <Area type="monotone" dataKey="expense" stroke="#EF4444" fillOpacity={1} fill="url(#colorDailyExpense)" name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Account Balances */}
        <Card>
          <CardHeader>
            <CardTitle>Account Balances</CardTitle>
            <CardDescription>Top accounts by balance</CardDescription>
          </CardHeader>
          <CardContent>
            {data.accountBalances.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={data.accountBalances} 
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                      return value.toString();
                    }} 
                  />
                  <YAxis dataKey="name" type="category" width={90} />
                  <Tooltip formatter={(value: number) => formatCurrency(value, 'IDR')} />
                  <Bar dataKey="balance" radius={[0, 8, 8, 0]}>
                    {data.accountBalances.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.balance >= 0 ? '#10B981' : '#EF4444'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No account data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3: Net Worth & Income Categories */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Net Worth Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Net Worth Summary</CardTitle>
            <CardDescription>Assets, Liabilities, and Net Worth</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Total Assets</span>
                <span className="text-lg font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(data.totalAssets, 'IDR')}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Total Liabilities</span>
                <span className="text-lg font-bold text-red-700 dark:text-red-300">
                  {formatCurrency(data.totalLiabilities, 'IDR')}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Net Worth</span>
                <span className={cn(
                  "text-xl font-bold",
                  data.netWorth >= 0 ? "text-blue-700 dark:text-blue-300" : "text-red-700 dark:text-red-300"
                )}>
                  {formatCurrency(data.netWorth, 'IDR')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Income Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Income Sources</CardTitle>
            <CardDescription>Breakdown by source</CardDescription>
          </CardHeader>
          <CardContent>
            {data.incomeCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.incomeCategories as any}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) =>
                      `${props?.name ?? ''}: ${((props?.percent ?? 0) * 100).toFixed(1)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {data.incomeCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value, 'IDR')} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No income data for this month
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Top Transactions & Insights */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Top Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Top Expenses</CardTitle>
            <CardDescription>Largest expenses this month</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topExpenses.length > 0 ? (
              <div className="space-y-3">
                {data.topExpenses.map((expense, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{expense.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(expense.amount, 'IDR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No expenses this month</div>
            )}
          </CardContent>
        </Card>

        {/* Top Incomes */}
        <Card>
          <CardHeader>
            <CardTitle>Top Income Sources</CardTitle>
            <CardDescription>Largest income sources this month</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topIncomes.length > 0 ? (
              <div className="space-y-3">
                {data.topIncomes.map((income, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{income.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(income.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(income.amount, 'IDR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No income this month</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Spending Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Spending Insights</CardTitle>
          <CardDescription>Analysis and projections for {monthLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Average Daily Spending</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {formatCurrency(data.averageDailySpending, 'IDR')}
              </div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Days Until Month End</div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {data.daysUntilMonthEnd}
              </div>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <div className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Projected Monthly Spending</div>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {formatCurrency(data.projectedMonthlySpending, 'IDR')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
