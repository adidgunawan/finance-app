import { useState, useMemo } from 'react';
import { useNetWorth } from './hooks/useNetWorth';
import { Select } from '../../components/Form/Select';
import type { PeriodType } from './hooks/useBalanceSheet';
import { formatCurrency } from '../../lib/utils';
import { PageLoader } from '../../components/Layout/PageLoader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    return <PageLoader />;
  }

  if (error) {
    return <div className="text-destructive">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Net Worth</h1>
        <p className="text-sm text-muted-foreground">
          Track your net worth over time.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Net Worth</CardTitle>
          <CardDescription>Latest available snapshot</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">
            {formatCurrency(currentNetWorth, 'IDR')}
          </div>
        </CardContent>
      </Card>

      <div className="max-w-xs">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Net Worth Growth</CardTitle>
          <CardDescription>Over the selected period type</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="period"
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                  tickFormatter={formatYAxisTick}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  formatter={(value: number) => formatTooltipValue(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--popover-foreground))',
                  }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                />
                <Line
                  type="monotone"
                  dataKey="netWorth"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

