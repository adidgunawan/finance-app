import { useState, useEffect } from 'react';
import { useTransactions } from '../../transactions/hooks/useTransactions';
import { useAccounts } from '../../chart-of-accounts/hooks/useAccounts';

interface TrendData {
    date: string;
    amount: number;
}

interface WalletData {
    id: string;
    name: string;
    balance: number;
    percentOfTotal: number;
    todaySpent: number;
}

interface ContactData {
    id: string;
    name: string;
    avatar?: string;
}

interface HomeData {
    totalBalance: number;
    balanceChange: number;
    balanceChangePercent: number;
    monthlySpent: number;
    monthlySpentChange: number;
    monthlySpentPercent: number;
    monthlyIncome: number;
    monthlyIncomeChange: number;
    monthlyIncomePercent: number;
    spentTrendData: TrendData[];
    incomeTrendData: TrendData[];
    wallets: WalletData[];
    quickContacts: ContactData[];
}

export function useHomeData(selectedMonth: Date = new Date()) {
    const { transactions, loading: transactionsLoading } = useTransactions();
    const { accounts, loading: accountsLoading } = useAccounts();
    const [homeData, setHomeData] = useState<HomeData>({
        totalBalance: 0,
        balanceChange: 0,
        balanceChangePercent: 0,
        monthlySpent: 0,
        monthlySpentChange: 0,
        monthlySpentPercent: 0,
        monthlyIncome: 0,
        monthlyIncomeChange: 0,
        monthlyIncomePercent: 0,
        spentTrendData: [],
        incomeTrendData: [],
        wallets: [],
        quickContacts: [],
    });

    useEffect(() => {
        if (!transactions || transactions.length === 0) {
            return;
        }

        const currentMonth = selectedMonth.getMonth();
        const currentYear = selectedMonth.getFullYear();
        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const today = new Date().toISOString().split('T')[0];

        // Calculate current and previous month income/expense
        let currentMonthIncome = 0;
        let currentMonthExpense = 0;
        let previousMonthIncome = 0;
        let previousMonthExpense = 0;
        let todayExpenseByAccount = new Map<string, number>();

        transactions.forEach((txn) => {
            const txnDate = new Date(txn.date);
            const txnMonth = txnDate.getMonth();
            const txnYear = txnDate.getFullYear();

            // Current month
            if (txnMonth === currentMonth && txnYear === currentYear) {
                if (txn.type === 'Income') {
                    currentMonthIncome += txn.total;
                } else if (txn.type === 'Expense') {
                    currentMonthExpense += txn.total;

                    // Track today's spending by account (from paid_from_account_id)
                    if (txn.date === today && (txn as any).paid_from_account_id) {
                        const accountId = (txn as any).paid_from_account_id;
                        todayExpenseByAccount.set(
                            accountId,
                            (todayExpenseByAccount.get(accountId) || 0) + txn.total
                        );
                    }
                }
            }

            // Previous month
            if (txnMonth === previousMonth && txnYear === previousYear) {
                if (txn.type === 'Income') {
                    previousMonthIncome += txn.total;
                } else if (txn.type === 'Expense') {
                    previousMonthExpense += txn.total;
                }
            }
        });

        // Calculate total balance (simplified: total income - total expense)
        const totalIncome = transactions
            .filter((t) => t.type === 'Income')
            .reduce((sum, t) => sum + t.total, 0);
        const totalExpense = transactions
            .filter((t) => t.type === 'Expense')
            .reduce((sum, t) => sum + t.total, 0);
        const totalBalance = totalIncome - totalExpense;

        // Calculate balance change (current month income - expense)
        const balanceChange = currentMonthIncome - currentMonthExpense;
        const balanceChangePercent = totalBalance > 0
            ? (balanceChange / totalBalance) * 100
            : 0;

        // Calculate monthly spent change
        const monthlySpentChange = currentMonthExpense - previousMonthExpense;
        const monthlySpentPercent = previousMonthExpense > 0
            ? (monthlySpentChange / previousMonthExpense) * 100
            : 0;

        // Calculate monthly income change
        const monthlyIncomeChange = currentMonthIncome - previousMonthIncome;
        const monthlyIncomePercent = previousMonthIncome > 0
            ? (monthlyIncomeChange / previousMonthIncome) * 100
            : 0;

        // Generate trend data for the selected month (day 1 to last day of month)
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const spentTrendData: TrendData[] = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dateStr = date.toISOString().split('T')[0];

            const dayExpense = transactions
                .filter((t) => t.type === 'Expense' && t.date === dateStr)
                .reduce((sum, t) => sum + t.total, 0);

            spentTrendData.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                amount: dayExpense,
            });
        }

        // Generate trend data for income in the selected month
        const incomeTrendData: TrendData[] = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dateStr = date.toISOString().split('T')[0];

            const dayIncome = transactions
                .filter((t) => t.type === 'Income' && t.date === dateStr)
                .reduce((sum, t) => sum + t.total, 0);

            incomeTrendData.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                amount: dayIncome,
            });
        }

        // Create wallet list from accounts marked as wallets
        const walletAccounts = (accounts || []).filter(account => account.is_wallet);
        const wallets: WalletData[] = walletAccounts.map((account) => ({
            id: account.id,
            name: account.name,
            balance: account.balance || 0,
            percentOfTotal: totalBalance > 0 ? ((account.balance || 0) / totalBalance) * 100 : 0,
            todaySpent: todayExpenseByAccount.get(account.id) || 0,
        }));

        // Quick contacts feature removed - not used in current UI

        setHomeData({
            totalBalance,
            balanceChange,
            balanceChangePercent,
            monthlySpent: currentMonthExpense,
            monthlySpentChange,
            monthlySpentPercent,
            monthlyIncome: currentMonthIncome,
            monthlyIncomeChange,
            monthlyIncomePercent,
            spentTrendData,
            incomeTrendData,
            wallets,
            quickContacts: [], // Not used in current UI
        });
    }, [transactions, accounts, selectedMonth]);

    return { ...homeData, loading: transactionsLoading || accountsLoading };
}
