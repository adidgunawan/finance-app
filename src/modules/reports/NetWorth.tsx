import { useState, useMemo } from 'react';
import { useNetWorth } from './hooks/useNetWorth';
import { Select } from '../../components/Form/Select';
import type { PeriodType } from './hooks/useBalanceSheet';
import { formatCurrency } from '../../lib/utils';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export function NetWorth() {
  const { loading, error, getNetWorthData } = useNetWorth();
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');

  const netWorthData = useMemo(() => {
    return getNetWorthData(periodType);
  }, [periodType, getNetWorthData]);

  const currentNetWorth = useMemo(() => {
    if (netWorthData.length === 0) return 0;
    return netWorthData[netWorthData.length - 1].netWorth;
  }, [netWorthData]);

  // Format chart data for Recharts
  const chartData = useMemo(() => {
    return netWorthData.map((point) => ({
      period: point.label,
      netWorth: point.netWorth,
    }));
  }, [netWorthData]);

  // Custom tooltip formatter
  const formatTooltipValue = (value: number) => {
    return formatCurrency(value, 'IDR');
  };

  // Format Y-axis tick
  const formatYAxisTick = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  if (loading) {
    return (
      <div>
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div style={{ color: 'var(--error)', padding: '16px' }}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Net Worth Report</h1>
      </div>

      {/* Current Net Worth Display */}
      <div
        style={{
          marginBottom: '24px',
          padding: '20px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '4px',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Current Net Worth
        </div>
        <div style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)' }}>
          {formatCurrency(currentNetWorth, 'IDR')}
        </div>
      </div>

      {/* Period Type Selector */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ minWidth: '200px' }}>
          <Select
            label="Period Type"
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as PeriodType)}
            options={[
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
            ]}
          />
        </div>
      </div>

      {/* Chart */}
      <div
        style={{
          padding: '24px',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '4px',
          border: '1px solid var(--border-color)',
          marginBottom: '24px',
        }}
      >
        <h3 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: '600' }}>
          Net Worth Growth Over Time
        </h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis
                dataKey="period"
                stroke="var(--text-secondary)"
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="var(--text-secondary)"
                style={{ fontSize: '12px' }}
                tickFormatter={formatYAxisTick}
                tick={{ fill: 'var(--text-secondary)' }}
              />
              <Tooltip
                formatter={(value: number) => formatTooltipValue(value)}
                contentStyle={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                }}
                labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
              />
              <Line
                type="monotone"
                dataKey="netWorth"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={{ fill: 'var(--accent)', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            No data available
          </div>
        )}
      </div>
    </div>
  );
}

