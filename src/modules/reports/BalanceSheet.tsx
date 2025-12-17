import { useState, useMemo, useEffect, Fragment } from 'react';
import { useBalanceSheet, PeriodType, BalanceSheetData } from './hooks/useBalanceSheet';
import { useSearch } from '../../contexts/SearchContext';
import type { AccountType } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';
import { PageLoader } from '../../components/Layout/PageLoader';
import { HighlightText } from '../../components/Text/HighlightText';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Minus, Plus } from 'lucide-react';

interface AccountGroup {
  type: AccountType;
  accounts: BalanceSheetData[];
}


export function BalanceSheet() {
  const { accounts, transactions, loading, error, getBalanceSheetData, getPeriodRanges, fetchData } = useBalanceSheet();
  const { searchTerm, setSearchTerm } = useSearch();
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [numberOfPeriods, setNumberOfPeriods] = useState<number>(2);
  const [expandedTypes, setExpandedTypes] = useState<Set<AccountType>>(
    new Set(['Asset', 'Liability', 'Equity', 'Income', 'Expense'])
  );
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

  const allPeriodRanges = useMemo(() => {
    return getPeriodRanges(periodType);
  }, [periodType, getPeriodRanges]);

  // Get the latest N periods based on numberOfPeriods for comparison columns
  const selectedPeriods = useMemo(() => {
    return allPeriodRanges.slice(-numberOfPeriods);
  }, [allPeriodRanges, numberOfPeriods]);

  // Fetch all data once - we filter by date in getBalanceSheetData
  useEffect(() => {
    fetchData();
  }, []);

  // Initialize expanded parents by default - expand ALL accounts (parents and children)
  useEffect(() => {
    if (accounts.length > 0) {
      // Expand all account IDs (both parents and children)
      const allAccountIds = new Set<string>();
      accounts.forEach((acc) => {
        allAccountIds.add(acc.id);
      });
      setExpandedParents(allAccountIds);
    }
  }, [accounts]);

  // Clear search on mount/unmount
  useEffect(() => {
    setSearchTerm('');
    return () => setSearchTerm('');
  }, [setSearchTerm]);


  // Get comparison data for all selected periods
  const comparisonData = useMemo(() => {
    return selectedPeriods.map(period => ({
      period,
      data: getBalanceSheetData(period.startDate, period.endDate),
    }));
  }, [selectedPeriods, accounts, transactions, getBalanceSheetData]);

  // Organize accounts by type and hierarchy (use first period's data for structure)
  const groupedAccounts = useMemo(() => {
    const typeOrder: AccountType[] = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];
    const groups: AccountGroup[] = [];
    const rawData = comparisonData.length > 0 ? comparisonData[0].data : [];

    // Filter logic similar to ChartOfAccounts
    let dataToUse = rawData;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const accountsToInclude = new Set<string>();

      // Find direct matches
      const directlyMatching = rawData.filter((item) => {
        return (
          item.account.name.toLowerCase().includes(term) ||
          item.account.account_number.toString().includes(term) ||
          item.account.type.toLowerCase().includes(term)
        );
      });

      // Include hierarchy
      directlyMatching.forEach((item) => {
        accountsToInclude.add(item.account.id);
        let currentAccount = item.account;
        while (currentAccount.parent_id) {
          const parent = rawData.find((d) => d.account.id === currentAccount.parent_id);
          if (parent) {
            accountsToInclude.add(parent.account.id);
            currentAccount = parent.account;
          } else {
            break;
          }
        }
      });

      dataToUse = rawData.filter((item) => accountsToInclude.has(item.account.id));
    }

    typeOrder.forEach((type) => {
      const typeAccounts = dataToUse.filter((item) => item.account.type === type);
      if (typeAccounts.length > 0) {
        groups.push({ type, accounts: typeAccounts });
      }
    });

    return groups;
  }, [comparisonData]);

  // Get parent accounts (accounts with no parent)
  const getParentAccounts = (typeAccounts: BalanceSheetData[]): BalanceSheetData[] => {
    return typeAccounts.filter((item) => !item.account.parent_id);
  };

  // Get child accounts for a parent
  const getChildAccounts = (parentId: string, typeAccounts: BalanceSheetData[]): BalanceSheetData[] => {
    return typeAccounts.filter((item) => item.account.parent_id === parentId);
  };

  // Calculate total for a group of accounts
  const calculateTotal = (items: BalanceSheetData[]): number => {
    return items.reduce((sum, item) => sum + item.balance, 0);
  };

  const toggleTypeExpanded = (type: AccountType) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  const toggleParentExpanded = (parentId: string) => {
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId);
    } else {
      newExpanded.add(parentId);
    }
    setExpandedParents(newExpanded);
  };

  // Get balance for an account in a specific period
  const getAccountBalance = (accountId: string, periodData: BalanceSheetData[]): number => {
    const account = periodData.find(item => item.account.id === accountId);
    return account?.balance || 0;
  };

  const renderAccountRow = (
    accountData: BalanceSheetData,
    level: number = 0,
    typeAccounts: BalanceSheetData[],
    comparisonPeriods: typeof comparisonData
  ) => {
    const children = getChildAccounts(accountData.account.id, typeAccounts);
    const hasChildren = children.length > 0;
    const isExpanded = expandedParents.has(accountData.account.id);
    const indent = level * 24;
    const isParent = level === 0;


    // const childrenTotal = hasChildren && isExpanded
    //   ? children.reduce((sum, child) => {
    //       const childTotal = calculateTotal(getChildAccounts(child.account.id, typeAccounts));
    //       return sum + child.balance + (childTotal > 0 ? childTotal : 0);
    //     }, 0)
    //   : 0;

    return (
      <Fragment key={accountData.account.id}>
        <tr className={cn("bg-background", isParent && "font-medium")}>
          <td className="px-3 py-2" style={{ paddingLeft: `${12 + indent}px` }}>
            {hasChildren && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mr-1 h-6 w-6"
                onClick={() => toggleParentExpanded(accountData.account.id)}
              >
                {isExpanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
            )}
            {!hasChildren && <span className="inline-block w-7" />}
            <span className={cn(isParent && "font-medium")}>
              <HighlightText text={accountData.account.account_number.toString()} highlight={searchTerm} />
            </span>
          </td>
          <td className="sticky left-0 z-10 border-r bg-background px-3 py-2">
            <span className={cn(isParent && "font-medium")}>
              <HighlightText text={accountData.account.name} highlight={searchTerm} />
            </span>
          </td>
          {comparisonPeriods.map((comp, idx) => {
            const balance = getAccountBalance(accountData.account.id, comp.data);
            return (
              <td
                key={idx}
                className={cn("px-3 py-2 text-right", isParent && "font-medium")}
              >
                {formatCurrency(balance, 'IDR')}
              </td>
            );
          })}
        </tr>
        {hasChildren && isExpanded && (
          <>
            {children
              .sort((a, b) => a.account.account_number - b.account.account_number)
              .map((child) => renderAccountRow(child, level + 1, typeAccounts, comparisonPeriods))}
          </>
        )}
      </Fragment>
    );
  };

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return <div className="text-destructive">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Balance Sheet</h1>
        <p className="text-sm text-muted-foreground">
          Compare balances across periods.
        </p>
      </div>

      {/* Period Selection */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Period Type</div>
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as PeriodType)}
            className="h-9 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Comparison</div>
          <select
            value={numberOfPeriods}
            onChange={(e) => setNumberOfPeriods(parseInt(e.target.value, 10))}
            className="h-9 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Balance Sheet Table */}
      {groupedAccounts.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
          No accounts found.
        </div>
      ) : (
        <div className="space-y-6">
          {groupedAccounts.map((group) => {
            const parentAccounts = getParentAccounts(group.accounts);
            const isTypeExpanded = expandedTypes.has(group.type);

            return (
              <div key={group.type} className="rounded-md border">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 border-b bg-muted/40 px-3 py-2 text-sm font-medium"
                  onClick={() => toggleTypeExpanded(group.type)}
                >
                  <span className="flex items-center gap-2">
                    {isTypeExpanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {group.type}
                  </span>
                  <span className="hidden items-center gap-4 sm:flex">
                    {comparisonData.map((comp, idx) => {
                      const periodTotal = calculateTotal(comp.data.filter(item => item.account.type === group.type));
                      return (
                        <span key={idx} className="min-w-[120px] text-right font-medium">
                          {formatCurrency(periodTotal, 'IDR')}
                        </span>
                      );
                    })}
                  </span>
                </button>
                {isTypeExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-sm">
                      <thead className="text-muted-foreground">
                        <tr className="border-b">
                          <th className="w-[120px] px-3 py-2 text-left font-medium">Number</th>
                          <th className="sticky left-0 z-20 border-r bg-muted/40 px-3 py-2 text-left font-medium">
                            Account Name
                          </th>
                          {comparisonData.map((comp, idx) => (
                            <th key={idx} className="w-[150px] px-3 py-2 text-right font-medium">
                              {comp.period.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="[&_tr:hover]:bg-muted/30">
                        {parentAccounts
                          .sort((a, b) => a.account.account_number - b.account.account_number)
                          .map((parent) =>
                            renderAccountRow(parent, 0, group.accounts, comparisonData)
                          )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

