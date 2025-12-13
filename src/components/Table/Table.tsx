import { useState, useMemo } from 'react';
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/Button/Button';
import { ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  onEdit?: (row: T, field: string, value: any) => void;
  onDelete?: (row: T) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  mobileRenderer?: (row: T, index: number, allData: T[]) => React.ReactNode;
}

export function Table<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  onEdit,
  onDelete,
  searchable = false,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data available',
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  mobileRenderer,
}: TableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnKey: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    return data.filter((row) =>
      columns.some((col) => {
        const value = (row as any)[col.key];
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);

  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = (a as any)[sortColumn];
      const bVal = (b as any)[sortColumn];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleCellClick = (row: T, column: Column<T>) => {
    if (onEdit && column.key !== 'actions') {
      const value = (row as any)[column.key];
      setEditingCell({ rowId: row.id, columnKey: column.key });
      setEditValue(value?.toString() || '');
    }
  };

  const handleCellBlur = (row: T, column: Column<T>) => {
    if (editingCell && onEdit) {
      onEdit(row, column.key, editValue);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleCellKeyDown = (e: React.KeyboardEvent, row: T, column: Column<T>) => {
    if (e.key === 'Enter') {
      handleCellBlur(row, column);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelectionChange) return;
    if (e.target.checked) {
      onSelectionChange(sortedData.map((row) => row.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (id: string) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const allSelected = sortedData.length > 0 && sortedData.every((row) => selectedIds.includes(row.id));
  const someSelected = sortedData.some((row) => selectedIds.includes(row.id)) && !allSelected;

  return (
    <div>
      {searchable && (
        <div className="mb-4">
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      )}

      <div className="desktop-only">
        <ShadcnTable>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-[40px]">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={handleSelectAll}
                    className="cursor-pointer"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  style={{ width: column.width }}
                  className={cn(
                    column.sortable && 'cursor-pointer hover:bg-muted/50',
                    column.key === 'actions' && 'text-right'
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortColumn === column.key && (
                      <ArrowUpDown className={cn('h-4 w-4', sortDirection === 'desc' && 'rotate-180')} />
                    )}
                  </div>
                </TableHead>
              ))}
              {onDelete && <TableHead className="w-[80px] text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (onDelete ? 1 : 0) + (selectable ? 1 : 0)}
                  className="text-center py-8"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(onRowClick && 'cursor-pointer')}
                >
                  {selectable && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => handleSelectRow(row.id)}
                        className="cursor-pointer"
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => {
                    const isEditing =
                      editingCell?.rowId === row.id && editingCell?.columnKey === column.key;
                    const value = (row as any)[column.key];

                    return (
                      <TableCell
                        key={column.key}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCellClick(row, column);
                        }}
                        className={cn(column.key === 'actions' && 'text-right')}
                      >
                        {isEditing ? (
                          <Input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellBlur(row, column)}
                            onKeyDown={(e) => handleCellKeyDown(e, row, column)}
                            autoFocus
                            className="h-8 w-full"
                          />
                        ) : column.render ? (
                          column.render(value, row)
                        ) : (
                          value
                        )}
                      </TableCell>
                    );
                  })}
                  {onDelete && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDelete(row)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </ShadcnTable>
      </div>

      <div className="mobile-only">
        {sortedData.length === 0 ? (
          <div className="text-center py-8">{emptyMessage}</div>
        ) : (
          <div className="mobile-list">
            {sortedData.map((row, index) =>
              mobileRenderer ? (
                <div key={row.id}>{mobileRenderer(row, index, sortedData)}</div>
              ) : (
                <div
                  key={row.id}
                  className="mobile-card"
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column) => {
                    if (column.key === 'actions') return null;
                    const value = (row as any)[column.key];
                    return (
                      <div key={column.key} className="mobile-card-row">
                        <span className="mobile-card-label">{column.label}</span>
                        <span className="mobile-card-value">
                          {column.render ? column.render(value, row) : value}
                        </span>
                      </div>
                    );
                  })}
                  {onDelete && (
                    <div className="mt-3 text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(row);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
