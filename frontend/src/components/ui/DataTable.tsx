'use client';

import { type ReactNode, useState, useEffect } from 'react';
import Card from './Card';
import { EditIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import { useTranslation } from '@/context/I18nContext';

export interface Column<T> {
  header: string;
  headerClassName?: string;
  render: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  pageSize?: number;
}

export default function DataTable<T>({ columns, data, keyExtractor, pageSize = 8 }: DataTableProps<T>) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(data.length / pageSize);
  const start = page * pageSize;
  const pageData = data.slice(start, start + pageSize);
  const showPagination = data.length > pageSize;

  // Reset to first page when data changes (e.g. filters applied)
  useEffect(() => { setPage(0); }, [data.length]);

  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col, i) => (
              <th
                key={i}
                className={col.headerClassName ?? `pb-3 ${i < columns.length - 1 ? 'pr-4' : ''} font-semibold text-text-primary`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageData.map((item, idx) => (
            <tr
              key={keyExtractor(item)}
              className={idx < pageData.length - 1 ? 'border-b border-border/50' : ''}
            >
              {columns.map((col, i) => (
                <td key={i} className={`py-3 ${i < columns.length - 1 ? 'pr-4' : ''}`}>
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {showPagination && (
        <div className="flex items-center justify-between border-t border-border pt-3 mt-3">
          <p className="text-xs text-text-muted">
            {t('table.showing', {
              from: String(start + 1),
              to: String(Math.min(start + pageSize, data.length)),
              total: String(data.length),
            })}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon />
            </button>
            <span className="px-2 text-xs text-text-secondary">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Reusable action-button helpers ───────────────────────────────────

interface ActionButtonsProps {
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
}

export function ActionButtons({ onEdit, onDelete, editLabel = 'Edit', deleteLabel = 'Delete' }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={onEdit}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors cursor-pointer"
        title={editLabel}
      >
        <EditIcon />
      </button>
      <button
        onClick={onDelete}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
        title={deleteLabel}
      >
        <TrashIcon />
      </button>
    </div>
  );
}
