import type { ParsedCsvRow, MatchStatus } from '../../lib/types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { HighlightText } from '../../components/Text/HighlightText';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CsvTransactionTableProps {
  rows: ParsedCsvRow[];
  matches?: Map<number, MatchStatus>; // Map of row index to match status
  onFindTransaction?: (rowIndex: number, row: ParsedCsvRow) => void;
  searchTerm?: string;
}

export function CsvTransactionTable({
  rows,
  matches = new Map(),
  onFindTransaction,
  searchTerm = '',
}: CsvTransactionTableProps) {
  const getMatchStatusBadge = (rowIndex: number) => {
    const status = matches.get(rowIndex);
    
    const styles: Record<MatchStatus | 'unmatched', { className: string; text: string }> = {
      matched: { className: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'Matched' },
      new: { className: 'bg-amber-50 text-amber-700 border-amber-200', text: 'New Transaction' },
      pending: { className: 'bg-slate-50 text-slate-600 border-slate-200', text: 'Unmatched' },
      unmatched: { className: 'bg-slate-50 text-slate-600 border-slate-200', text: 'Unmatched' },
    };

    const displayStatus = (!status || status === 'pending') ? 'unmatched' : status;

    return (
      <Badge variant="outline" className={styles[displayStatus].className}>
        {styles[displayStatus].text}
      </Badge>
    );
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        No CSV transactions to display
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <ShadcnTable>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Date</TableHead>
            <TableHead className="min-w-[320px]">Description</TableHead>
            <TableHead className="w-[160px]">Branch</TableHead>
            <TableHead className="w-[160px] text-right">Amount</TableHead>
            <TableHead className="w-[160px] text-right">Balance</TableHead>
            <TableHead className="w-[120px] text-center">Type</TableHead>
            <TableHead className="w-[160px] text-center">Status</TableHead>
            <TableHead className="w-[160px] text-center">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell className="align-top py-3">{formatDate(row.date)}</TableCell>
              <TableCell className="max-w-[520px] align-top py-3">
                <div 
                  className="pr-2" 
                  title={row.description}
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    wordBreak: 'break-word',
                  }}
                >
                  {searchTerm ? <HighlightText text={row.description} highlight={searchTerm} /> : row.description}
                </div>
              </TableCell>
              <TableCell className="align-top py-3">
                {searchTerm ? <HighlightText text={row.branch} highlight={searchTerm} /> : row.branch}
              </TableCell>
              <TableCell className={`text-right align-top py-3 ${row.type === 'debit' ? 'text-destructive' : 'text-emerald-600'}`}>
                {searchTerm ? <HighlightText text={formatCurrency(row.amount, 'IDR')} highlight={searchTerm} /> : formatCurrency(row.amount, 'IDR')}
              </TableCell>
              <TableCell className="text-right align-top py-3">
                {formatCurrency(row.balance, 'IDR')}
              </TableCell>
              <TableCell className="text-center align-top py-3">
                <Badge
                  variant="outline"
                  className={row.type === 'debit'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }
                >
                  {row.type.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell className="text-center align-top py-3">
                {getMatchStatusBadge(index)}
              </TableCell>
              <TableCell className="text-center align-top py-3">
                {onFindTransaction ? (
                  <Button size="sm" onClick={() => onFindTransaction(index, row)}>
                    Find Transaction
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </ShadcnTable>
    </div>
  );
}

