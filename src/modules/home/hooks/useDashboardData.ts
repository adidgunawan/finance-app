import { useState, useEffect } from 'react';
import { useTransactions } from '../../transactions/hooks/useTransactions';
import { useAccounts } from '../../chart-of-accounts/hooks/useAccounts';

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface AccountBalanceData {
  name: string;
  balance: number;
  type: string;
}

export interface TopTransaction {
  description: string;
  amount: number;
  date: string;
  type: 'Income' | 'Expense';
}

export interface DashboardData {
  // Current month summary
  currentMonthIncome: number;
  currentMonthExpense: number;
  currentMonthNet: number;
  currentMonthSavingsRate: number;
  
  // Previous month comparison
  previousMonthIncome: number;
  previousMonthExpense: number;
  previousMonthNet: number;
  incomeChange: number;
  incomeChangePercent: number;
  expenseChange: number;
  expenseChangePercent: number;
  netChange: number;
  netChangePercent: number;
  
  // Monthly trends (last 6 months)
  monthlyTrends: MonthlyData[];
  
  // Category breakdowns
  expenseCategories: CategoryData[];
  incomeCategories: CategoryData[];
  
  // Account balances
  accountBalances: AccountBalanceData[];
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  
  // Daily cash flow (current month)
  dailyCashFlow: { date: string; income: number; expense: number; net: number }[];
  
  // Top transactions
  topExpenses: TopTransaction[];
  topIncomes: TopTransaction[];
  
  // Spending insights
  averageDailySpending: number;
  daysUntilMonthEnd: number;
  projectedMonthlySpending: number;
  
  loading: boolean;
}

const CATEGORY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export function useDashboardData(selectedMonth: Date = new Date()) {
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { accounts, loading: accountsLoading } = useAccounts();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    currentMonthIncome: 0,
    currentMonthExpense: 0,
    currentMonthNet: 0,
    currentMonthSavingsRate: 0,
    previousMonthIncome: 0,
    previousMonthExpense: 0,
    previousMonthNet: 0,
    incomeChange: 0,
    incomeChangePercent: 0,
    expenseChange: 0,
    expenseChangePercent: 0,
    netChange: 0,
    netChangePercent: 0,
    monthlyTrends: [],
    expenseCategories: [],
    incomeCategories: [],
    accountBalances: [],
    totalAssets: 0,
    totalLiabilities: 0,
    netWorth: 0,
    dailyCashFlow: [],
    topExpenses: [],
    topIncomes: [],
    averageDailySpending: 0,
    daysUntilMonthEnd: 0,
    projectedMonthlySpending: 0,
    loading: true,
  });

  useEffect(() => {
    if (transactionsLoading || accountsLoading || !transactions || transactions.length === 0) {
      setDashboardData(prev => ({ ...prev, loading: transactionsLoading || accountsLoading }));
      return;
    }

    const currentMonth = selectedMonth.getMonth();
    const currentYear = selectedMonth.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const today = new Date();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = today.getDate();
    const daysUntilMonthEnd = daysInMonth - currentDay;

    // Calculate current month data
    let currentMonthIncome = 0;
    let currentMonthExpense = 0;
    const currentMonthTransactions: typeof transactions = [];

    transactions.forEach((txn) => {
      const txnDate = new Date(txn.date);
      const txnMonth = txnDate.getMonth();
      const txnYear = txnDate.getFullYear();

      if (txnMonth === currentMonth && txnYear === currentYear) {
        currentMonthTransactions.push(txn);
        if (txn.type === 'Income') {
          currentMonthIncome += txn.total;
        } else if (txn.type === 'Expense') {
          currentMonthExpense += txn.total;
        }
      }
    });

    const currentMonthNet = currentMonthIncome - currentMonthExpense;
    const currentMonthSavingsRate = currentMonthIncome > 0 
      ? (currentMonthNet / currentMonthIncome) * 100 
      : 0;

    // Calculate previous month data
    let previousMonthIncome = 0;
    let previousMonthExpense = 0;

    transactions.forEach((txn) => {
      const txnDate = new Date(txn.date);
      const txnMonth = txnDate.getMonth();
      const txnYear = txnDate.getFullYear();

      if (txnMonth === previousMonth && txnYear === previousYear) {
        if (txn.type === 'Income') {
          previousMonthIncome += txn.total;
        } else if (txn.type === 'Expense') {
          previousMonthExpense += txn.total;
        }
      }
    });

    const previousMonthNet = previousMonthIncome - previousMonthExpense;

    // Calculate changes
    const incomeChange = currentMonthIncome - previousMonthIncome;
    const incomeChangePercent = previousMonthIncome > 0
      ? (incomeChange / previousMonthIncome) * 100
      : 0;

    const expenseChange = currentMonthExpense - previousMonthExpense;
    const expenseChangePercent = previousMonthExpense > 0
      ? (expenseChange / previousMonthExpense) * 100
      : 0;

    const netChange = currentMonthNet - previousMonthNet;
    const netChangePercent = previousMonthNet !== 0
      ? (netChange / Math.abs(previousMonthNet)) * 100
      : 0;

    // Generate monthly trends (last 6 months)
    const monthlyTrends: MonthlyData[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentYear, currentMonth - i, 1);
      const month = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const monthIndex = monthDate.getMonth();
      const monthYear = monthDate.getFullYear();

      let monthIncome = 0;
      let monthExpense = 0;

      transactions.forEach((txn) => {
        const txnDate = new Date(txn.date);
        if (txnDate.getMonth() === monthIndex && txnDate.getFullYear() === monthYear) {
          if (txn.type === 'Income') {
            monthIncome += txn.total;
          } else if (txn.type === 'Expense') {
            monthExpense += txn.total;
          }
        }
      });

      monthlyTrends.push({
        month,
        income: monthIncome,
        expense: monthExpense,
        net: monthIncome - monthExpense,
      });
    }

    // Calculate category breakdowns
    const expenseCategoryMap = new Map<string, number>();
    const incomeCategoryMap = new Map<string, number>();

    currentMonthTransactions.forEach((txn) => {
      if (txn.type === 'Expense' && txn.items) {
        txn.items.forEach((item) => {
          const categoryName = item.account?.name || 'Uncategorized';
          expenseCategoryMap.set(
            categoryName,
            (expenseCategoryMap.get(categoryName) || 0) + item.amount
          );
        });
      } else if (txn.type === 'Income' && txn.items) {
        txn.items.forEach((item) => {
          const categoryName = item.account?.name || 'Uncategorized';
          incomeCategoryMap.set(
            categoryName,
            (incomeCategoryMap.get(categoryName) || 0) + item.amount
          );
        });
      }
    });

    const expenseCategories: CategoryData[] = Array.from(expenseCategoryMap.entries())
      .map(([name, amount], index) => ({
        name,
        amount,
        percentage: currentMonthExpense > 0 ? (amount / currentMonthExpense) * 100 : 0,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const incomeCategories: CategoryData[] = Array.from(incomeCategoryMap.entries())
      .map(([name, amount], index) => ({
        name,
        amount,
        percentage: currentMonthIncome > 0 ? (amount / currentMonthIncome) * 100 : 0,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Calculate account balances
    const accountBalances: AccountBalanceData[] = (accounts || [])
      .filter(acc => acc.balance !== undefined && acc.balance !== 0)
      .map(acc => ({
        name: acc.name,
        balance: acc.balance || 0,
        type: acc.type,
      }))
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
      .slice(0, 10);

    const totalAssets = (accounts || [])
      .filter(acc => acc.type === 'Asset')
      .reduce((sum, acc) => sum + (acc.balance || 0), 0);

    const totalLiabilities = (accounts || [])
      .filter(acc => acc.type === 'Liability')
      .reduce((sum, acc) => sum + (acc.balance || 0), 0);

    const netWorth = totalAssets - totalLiabilities;

    // Generate daily cash flow for current month
    const dailyCashFlow: { date: string; income: number; expense: number; net: number }[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().split('T')[0];

      let dayIncome = 0;
      let dayExpense = 0;

      transactions.forEach((txn) => {
        if (txn.date === dateStr) {
          if (txn.type === 'Income') {
            dayIncome += txn.total;
          } else if (txn.type === 'Expense') {
            dayExpense += txn.total;
          }
        }
      });

      dailyCashFlow.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        income: dayIncome,
        expense: dayExpense,
        net: dayIncome - dayExpense,
      });
    }

    // Get top expenses and incomes
    const topExpenses: TopTransaction[] = currentMonthTransactions
      .filter(txn => txn.type === 'Expense')
      .map(txn => ({
        description: txn.items?.[0]?.description || txn.items?.[0]?.account?.name || 'Expense',
        amount: txn.total,
        date: txn.date,
        type: 'Expense' as const,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const topIncomes: TopTransaction[] = currentMonthTransactions
      .filter(txn => txn.type === 'Income')
      .map(txn => ({
        description: txn.items?.[0]?.description || txn.items?.[0]?.account?.name || 'Income',
        amount: txn.total,
        date: txn.date,
        type: 'Income' as const,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Calculate spending insights
    const averageDailySpending = currentDay > 0 ? currentMonthExpense / currentDay : 0;
    const projectedMonthlySpending = averageDailySpending * daysInMonth;

    setDashboardData({
      currentMonthIncome,
      currentMonthExpense,
      currentMonthNet,
      currentMonthSavingsRate,
      previousMonthIncome,
      previousMonthExpense,
      previousMonthNet,
      incomeChange,
      incomeChangePercent,
      expenseChange,
      expenseChangePercent,
      netChange,
      netChangePercent,
      monthlyTrends,
      expenseCategories,
      incomeCategories,
      accountBalances,
      totalAssets,
      totalLiabilities,
      netWorth,
      dailyCashFlow,
      topExpenses,
      topIncomes,
      averageDailySpending,
      daysUntilMonthEnd,
      projectedMonthlySpending,
      loading: false,
    });
  }, [transactions, accounts, selectedMonth, transactionsLoading, accountsLoading]);

  return dashboardData;
}
