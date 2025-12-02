import { useState, useMemo } from 'react';

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

  return (
    <div>
      {searchable && (
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: '100%', width: '100%' }}
          />
        </div>
      )}
      
      {/* Desktop Table View */}
      <table className="desktop-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  width: column.width,
                  cursor: column.sortable ? 'pointer' : 'default',
                }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                {column.label}
                {column.sortable && sortColumn === column.key && (
                  <span style={{ marginLeft: '4px', color: 'var(--text-tertiary)' }}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
            ))}
            {onDelete && <th style={{ width: '80px' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (onDelete ? 1 : 0)} style={{ textAlign: 'center', padding: '32px' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick && onRowClick(row)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((column) => {
                  const isEditing =
                    editingCell?.rowId === row.id && editingCell?.columnKey === column.key;
                  const value = (row as any)[column.key];

                  return (
                    <td
                      key={column.key}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCellClick(row, column);
                      }}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCellBlur(row, column)}
                          onKeyDown={(e) => handleCellKeyDown(e, row, column)}
                          autoFocus
                          style={{ width: '100%', margin: '-6px -8px', padding: '6px 8px' }}
                        />
                      ) : column.render ? (
                        column.render(value, row)
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
                {onDelete && (
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="danger"
                      onClick={() => onDelete(row)}
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      {/* Mobile Card View */}
      <div className="table-cards">
        {sortedData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
            {emptyMessage}
          </div>
        ) : (
          sortedData.map((row) => (
            <div
              key={row.id}
              className="table-card"
              onClick={() => onRowClick && onRowClick(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((column) => {
                const value = (row as any)[column.key];
                return (
                  <div key={column.key} className="table-card-row">
                    <div>
                      <div className="table-card-label">{column.label}</div>
                      <div className="table-card-value">
                        {column.render ? column.render(value, row) : value}
                      </div>
                    </div>
                  </div>
                );
              })}
              {onDelete && (
                <div className="table-card-actions">
                  <button
                    className="danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(row);
                    }}
                    style={{ width: '100%' }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

