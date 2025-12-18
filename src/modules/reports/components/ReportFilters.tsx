import type { PeriodType } from "../hooks/useBalanceSheet";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ReportFiltersProps {
  periodType: PeriodType;
  onPeriodTypeChange: (value: PeriodType) => void;
  numberOfPeriods: number;
  onNumberOfPeriodsChange: (value: number) => void;
  maxPeriods?: number;
}

export function ReportFilters({
  periodType,
  onPeriodTypeChange,
  numberOfPeriods,
  onNumberOfPeriodsChange,
  maxPeriods = 12,
}: ReportFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="grid gap-2">
        <Label>Period Type</Label>
        <Select value={periodType} onValueChange={(v) => onPeriodTypeChange(v as PeriodType)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>Comparison</Label>
        <Select
          value={String(numberOfPeriods)}
          onValueChange={(v) => onNumberOfPeriodsChange(parseInt(v, 10))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: maxPeriods }, (_, i) => i + 1).map((num) => (
              <SelectItem key={num} value={String(num)}>
                {num}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}


