import { useState, useMemo, useEffect, Fragment } from 'react';
import { useBalanceSheet, PeriodType, BalanceSheetData, PeriodRange } from './hooks/useBalanceSheet';
import type { AccountType } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';

interface AccountGroup {
  type: AccountType;
  accounts: BalanceSheetData[];
}


export function BalanceSheet() {
  const { accounts, transactions, loading, error, getBalanceSheetData, getPeriodRanges, fetchData } = useBalanceSheet();
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
    const dataToUse = comparisonData.length > 0 ? comparisonData[0].data : [];

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

    // Calculate children total if expanded (currently unused but kept for future use)
    // const childrenTotal = hasChildren && isExpanded
    //   ? children.reduce((sum, child) => {
    //       const childTotal = calculateTotal(getChildAccounts(child.account.id, typeAccounts));
    //       return sum + child.balance + (childTotal > 0 ? childTotal : 0);
    //     }, 0)
    //   : 0;

    return (
      <Fragment key={accountData.account.id}>
        <tr
          style={{
            backgroundColor: 'var(--bg-primary)',
            fontWeight: isParent ? '600' : '400',
          }}
        >
          <td style={{ paddingLeft: `${12 + indent}px` }}>
            {hasChildren && (
              <button
                onClick={() => toggleParentExpanded(accountData.account.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0 4px',
                  marginRight: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                {isExpanded ? '−' : '+'}
              </button>
            )}
            {!hasChildren && <span style={{ marginLeft: '20px' }} />}
            <span style={{ fontWeight: isParent ? '600' : '400' }}>
              {accountData.account.account_number}
            </span>
          </td>
          <td>
            <span style={{ fontWeight: isParent ? '600' : '400' }}>
              {accountData.account.name}
            </span>
          </td>
          {comparisonPeriods.map((comp, idx) => {
            const balance = getAccountBalance(accountData.account.id, comp.data);
            return (
              <td
                key={idx}
                style={{
                  textAlign: 'right',
                  fontWeight: isParent ? '600' : '400',
                }}
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
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'var(--error)', padding: '16px' }}>Error: {error}</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Balance Sheet Report</h1>
      </div>

      {/* Period Selection */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', whiteSpace: 'nowrap', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', whiteSpace: 'nowrap' }}>
          <label style={{ whiteSpace: 'nowrap' }}>Period Type:</label>
          <select
            value={periodType}
            onChange={(e) => {
              setPeriodType(e.target.value as PeriodType);
            }}
            style={{ padding: '6px 12px' }}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', whiteSpace: 'nowrap' }}>
          <label style={{ whiteSpace: 'nowrap' }}>Comparison:</label>
          <select
            value={numberOfPeriods}
            onChange={(e) => {
              const num = parseInt(e.target.value, 10);
              setNumberOfPeriods(num);
            }}
            style={{ padding: '6px 12px', minWidth: '80px' }}
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
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No accounts found.
        </div>
      ) : (
        <div>
          {groupedAccounts.map((group) => {
            const parentAccounts = getParentAccounts(group.accounts);
            const isTypeExpanded = expandedTypes.has(group.type);

            return (
              <div key={group.type} style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                  onClick={() => toggleTypeExpanded(group.type)}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0 4px',
                        marginRight: '8px',
                        fontSize: '14px',
                      }}
                    >
                      {isTypeExpanded ? '−' : '+'}
                    </button>
                    <span>{group.type}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {comparisonData.map((comp, idx) => {
                      const periodTotal = calculateTotal(comp.data.filter(item => item.account.type === group.type));
                      return (
                        <span key={idx} style={{ fontWeight: '600', minWidth: '120px', textAlign: 'right' }}>
                          {formatCurrency(periodTotal, 'IDR')}
                        </span>
                      );
                    })}
                  </div>
                </div>
                {isTypeExpanded && (
                  <table style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '120px', textAlign: 'left' }}>Number</th>
                        <th style={{ textAlign: 'left' }}>Account Name</th>
                        {comparisonData.map((comp, idx) => (
                          <th key={idx} style={{ width: '150px', textAlign: 'right' }}>
                            {comp.period.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parentAccounts
                        .sort((a, b) => a.account.account_number - b.account.account_number)
                        .map((parent) => renderAccountRow(
                          parent,
                          0,
                          group.accounts,
                          comparisonData
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

