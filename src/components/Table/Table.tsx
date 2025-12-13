import * as React from 'react';
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
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
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
    <div className="space-y-4">
      {searchable && (
        <div className="w-full max-w-sm space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-background pl-9"
            />
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <ShadcnTable>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-[50px]">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-input cursor-pointer accent-primary"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  style={{ width: column.width }}
                  className={cn(
                    column.sortable && 'cursor-pointer hover:bg-muted/50 transition-colors',
                    column.key === 'actions' && 'text-right w-[100px]'
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && (
                      <div className="ml-2 flex flex-col">
                        {sortColumn === column.key ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3 w-3 text-primary" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground opacity-50" />
                        )}
                      </div>
                    )}
                  </div>
                </TableHead>
              ))}
              {onDelete && <TableHead className="w-[100px] text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (onDelete ? 1 : 0) + (selectable ? 1 : 0)}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    onRowClick && 'cursor-pointer',
                    'hover:bg-muted/50 transition-colors'
                  )}
                >
                  {selectable && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => handleSelectRow(row.id)}
                        className="h-4 w-4 rounded border-input cursor-pointer accent-primary"
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
                          <span className="text-sm">{value}</span>
                        )}
                      </TableCell>
                    );
                  })}
                  {onDelete && (
                    <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                      <Button
                        variant="destructive"
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
    </div>
  );
}
