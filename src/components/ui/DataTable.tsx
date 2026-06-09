'use client';
import { useMemo, useState } from 'react';
import EmptyState from './EmptyState';

export type Column<T> = {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
};

function getValue(row: any, key: string) {
  return row?.[key];
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading,
  defaultSortKey,
  defaultSortOrder = 'asc',
}: {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  defaultSortKey?: string;
  defaultSortOrder?: 'asc' | 'desc';
}) {
  const [sortBy, setSortBy] = useState<string | undefined>(defaultSortKey);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultSortOrder);

  const sorted = useMemo(() => {
    if (!sortBy) return data;
    const copy = [...data];
    copy.sort((a, b) => {
      const av = getValue(a, sortBy);
      const bv = getValue(b, sortBy);
      const ax = typeof av === 'string' ? av.toLowerCase() : av ?? '';
      const bx = typeof bv === 'string' ? bv.toLowerCase() : bv ?? '';
      if (ax < bx) return sortOrder === 'asc' ? -1 : 1;
      if (ax > bx) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [data, sortBy, sortOrder]);

  function toggleSort(col: string) {
    if (sortBy === col) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(col);
      setSortOrder('asc');
    }
  }

  return (
    <div className="w-full overflow-x-auto border rounded">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th
                key={String(c.key)}
                className={`px-3 py-2 text-left font-semibold ${c.sortable ? 'cursor-pointer select-none' : ''}`}
                onClick={() => c.sortable && toggleSort(String(c.key))}
              >
                <div className="flex items-center gap-1">
                  <span>{c.header}</span>
                  {c.sortable && sortBy === c.key && (
                    <span aria-hidden>{sortOrder === 'asc' ? '▲' : '▼'}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td className="px-3 py-6 text-center text-gray-500" colSpan={columns.length}>
                Cargando…
              </td>
            </tr>
          ) : sorted.length === 0 ? (
            <tr>
              <td className="px-3 py-4" colSpan={columns.length}>
                <EmptyState />
              </td>
            </tr>
          ) : (
            sorted.map((row, i) => (
              <tr key={i} className="border-t">
                {columns.map((c) => (
                  <td key={String(c.key)} className="px-3 py-2">
                    {c.render ? c.render(row) : (row as any)[c.key as string]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
