import { useState, useMemo, useEffect, Fragment } from 'react';
import { useBalanceSheet, PeriodType, BalanceSheetData, PeriodRange } from './hooks/useBalanceSheet';
import type { Account, AccountType } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';

interface AccountGroup {
  type: AccountType;
  accounts: BalanceSheetData[];
}

interface ComparisonData {
  period: PeriodRange;
  data: BalanceSheetData[];
}

export function BalanceSheet() {
  const { accounts, transactions, loading, error, getBalanceSheetData, getPeriodRanges, fetchData } = useBalanceSheet();
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodRange | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedPeriods, setSelectedPeriods] = useState<PeriodRange[]>([]);
  const [expandedTypes, setExpandedTypes] = useState<Set<AccountType>>(
    new Set(['Asset', 'Liability', 'Equity', 'Income', 'Expense'])
  );
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

  const periodRanges = useMemo(() => {
    return getPeriodRanges(periodType);
  }, [periodType, getPeriodRanges]);

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

  // Auto-select last 2 months when comparison mode is enabled
  useEffect(() => {
    if (comparisonMode && periodType === 'monthly' && periodRanges.length >= 2 && selectedPeriods.length === 0) {
      // Get the last 2 months (current month and last month)
      const lastTwoMonths = periodRanges.slice(-2);
      setSelectedPeriods(lastTwoMonths);
    }
  }, [comparisonMode, periodType, periodRanges, selectedPeriods.length]);

  const currentData = useMemo(() => {
    if (selectedPeriod) {
      return getBalanceSheetData(selectedPeriod.startDate, selectedPeriod.endDate);
    }
    return getBalanceSheetData();
  }, [selectedPeriod, accounts, transactions, getBalanceSheetData]);

  const comparisonData = useMemo(() => {
    if (!comparisonMode || selectedPeriods.length === 0) return [];
    
    return selectedPeriods.map(period => ({
      period,
      data: getBalanceSheetData(period.startDate, period.endDate),
    }));
  }, [comparisonMode, selectedPeriods, accounts, transactions, getBalanceSheetData]);

  // Organize accounts by type and hierarchy
  const groupedAccounts = useMemo(() => {
    const typeOrder: AccountType[] = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];
    const groups: AccountGroup[] = [];
    const dataToUse = comparisonMode && comparisonData.length > 0 
      ? comparisonData[0].data 
      : currentData;

    typeOrder.forEach((type) => {
      const typeAccounts = dataToUse.filter((item) => item.account.type === type);
      if (typeAccounts.length > 0) {
        groups.push({ type, accounts: typeAccounts });
      }
    });

    return groups;
  }, [currentData, comparisonData, comparisonMode]);

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

  // Get balance for an account in a specific period
  const getAccountBalance = (accountId: string, periodData: BalanceSheetData[]): number => {
    const account = periodData.find(item => item.account.id === accountId);
    return account?.balance || 0;
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

  const handlePeriodSelect = (period: PeriodRange) => {
    if (comparisonMode) {
      const isSelected = selectedPeriods.some(p => p.startDate === period.startDate && p.endDate === period.endDate);
      if (isSelected) {
        setSelectedPeriods(selectedPeriods.filter(p => !(p.startDate === period.startDate && p.endDate === period.endDate)));
      } else {
        setSelectedPeriods([...selectedPeriods, period]);
      }
    } else {
      setSelectedPeriod(period);
    }
  };

  const renderAccountRow = (
    accountData: BalanceSheetData,
    level: number = 0,
    typeAccounts: BalanceSheetData[],
    comparisonPeriods?: ComparisonData[]
  ) => {
    const children = getChildAccounts(accountData.account.id, typeAccounts);
    const hasChildren = children.length > 0;
    const isExpanded = expandedParents.has(accountData.account.id);
    const indent = level * 24;
    const isParent = level === 0;

    // Calculate children total if expanded
    const childrenTotal = hasChildren && isExpanded
      ? children.reduce((sum, child) => {
          const childTotal = calculateTotal(getChildAccounts(child.account.id, typeAccounts));
          return sum + child.balance + (childTotal > 0 ? childTotal : 0);
        }, 0)
      : 0;

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
          {comparisonMode && comparisonPeriods ? (
            <>
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
            </>
          ) : (
            <td style={{ textAlign: 'right', fontWeight: isParent ? '600' : '400' }}>
              {formatCurrency(accountData.balance, 'IDR')}
            </td>
          )}
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
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Balance Sheet Report</h1>
      </div>

      {/* Period Selection */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', whiteSpace: 'nowrap' }}>
          <label style={{ whiteSpace: 'nowrap' }}>Period Type:</label>
          <select
            value={periodType}
            onChange={(e) => {
              setPeriodType(e.target.value as PeriodType);
              setSelectedPeriod(null);
              setSelectedPeriods([]);
            }}
            style={{ padding: '6px 12px' }}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', whiteSpace: 'nowrap' }}>
          <label style={{ display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={comparisonMode}
              onChange={(e) => {
                const isEnabled = e.target.checked;
                setComparisonMode(isEnabled);
                if (!isEnabled) {
                  setSelectedPeriods([]);
                  setSelectedPeriod(null);
                } else {
                  // Ensure period type is monthly for auto-selection
                  if (periodType !== 'monthly') {
                    setPeriodType('monthly');
                  }
                  // Auto-select will happen in useEffect when periodRanges updates
                }
              }}
            />
            Comparison Mode
          </label>
        </div>
      </div>

      {/* Period List */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
          {comparisonMode ? 'Select Periods to Compare (up to 5)' : 'Select Period'}
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {periodRanges.map((period) => {
            const isSelected = comparisonMode
              ? selectedPeriods.some(p => p.startDate === period.startDate && p.endDate === period.endDate)
              : selectedPeriod?.startDate === period.startDate && selectedPeriod?.endDate === period.endDate;

            return (
              <button
                key={`${period.startDate}-${period.endDate}`}
                onClick={() => {
                  if (comparisonMode && selectedPeriods.length >= 5 && !isSelected) {
                    alert('Maximum 5 periods can be compared');
                    return;
                  }
                  handlePeriodSelect(period);
                }}
                style={{
                  padding: '8px 16px',
                  border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border-color)'}`,
                  backgroundColor: isSelected ? 'var(--accent)' : 'var(--bg-primary)',
                  color: isSelected ? 'white' : 'var(--text-primary)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: isSelected ? '600' : '400',
                }}
              >
                {period.label}
              </button>
            );
          })}
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
            const groupTotal = calculateTotal(group.accounts);

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
                  {comparisonMode && comparisonData.length > 0 ? (
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
                  ) : (
                    <span style={{ fontWeight: '600' }}>
                      {formatCurrency(groupTotal, 'IDR')}
                    </span>
                  )}
                </div>
                {isTypeExpanded && (
                  <table style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '120px', textAlign: 'left' }}>Number</th>
                        <th style={{ textAlign: 'left' }}>Account Name</th>
                        {comparisonMode && comparisonData.length > 0 ? (
                          comparisonData.map((comp, idx) => (
                            <th key={idx} style={{ width: '150px', textAlign: 'right' }}>
                              {comp.period.label}
                            </th>
                          ))
                        ) : (
                          <th style={{ width: '150px', textAlign: 'right' }}>Balance</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {parentAccounts
                        .sort((a, b) => a.account.account_number - b.account.account_number)
                        .map((parent) => renderAccountRow(
                          parent,
                          0,
                          group.accounts,
                          comparisonMode ? comparisonData : undefined
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

