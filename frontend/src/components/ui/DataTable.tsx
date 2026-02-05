import { type ReactNode } from 'react';
import Card from './Card';
import { EditIcon, TrashIcon } from '@/components/icons';

export interface Column<T> {
  header: string;
  headerClassName?: string;
  render: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
}

export default function DataTable<T>({ columns, data, keyExtractor }: DataTableProps<T>) {
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
          {data.map((item, idx) => (
            <tr
              key={keyExtractor(item)}
              className={idx < data.length - 1 ? 'border-b border-border/50' : ''}
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
