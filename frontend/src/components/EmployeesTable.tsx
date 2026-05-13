'use client';

import type { Employee } from '@/types/employee';
import { formatCurrency } from '@/lib/format';
import { StatusBadge } from './StatusBadge';

interface Props {
  employees: Employee[];
  sort: string;
  onSortChange: (sort: string) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

type SortKey = 'lastName' | 'firstName' | 'hourlyRate' | 'status';

const HEADERS: Array<{
  label: string;
  key: SortKey | null;
  align?: 'right' | 'left';
}> = [
  { label: 'Name', key: 'lastName' },
  { label: 'Email', key: null },
  { label: 'Position', key: null },
  { label: 'Project', key: null },
  { label: 'Rate / h', key: 'hourlyRate', align: 'right' },
  { label: 'Status', key: 'status' },
  { label: 'Actions', key: null, align: 'right' },
];

function parseSort(sort: string): { key: string; dir: 'asc' | 'desc' } {
  const [key, dir] = sort.split(':');
  return { key, dir: dir === 'desc' ? 'desc' : 'asc' };
}

export function EmployeesTable({
  employees,
  sort,
  onSortChange,
  onEdit,
  onDelete,
}: Props) {
  const current = parseSort(sort);

  if (employees.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
        No employees match the current filters.
      </div>
    );
  }

  function toggle(key: SortKey) {
    if (current.key === key) {
      onSortChange(`${key}:${current.dir === 'asc' ? 'desc' : 'asc'}`);
    } else {
      onSortChange(`${key}:asc`);
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            {HEADERS.map((h) => {
              const align = h.align === 'right' ? 'text-right' : 'text-left';
              if (!h.key) {
                return (
                  <th key={h.label} className={`px-4 py-2 font-medium ${align}`}>
                    {h.label}
                  </th>
                );
              }
              const isActive = current.key === h.key;
              const arrow = isActive ? (current.dir === 'asc' ? '↑' : '↓') : '';
              return (
                <th key={h.label} className={`px-4 py-2 font-medium ${align}`}>
                  <button
                    type="button"
                    onClick={() => toggle(h.key as SortKey)}
                    className="inline-flex items-center gap-1 hover:text-gray-900"
                  >
                    {h.label}
                    <span className="text-[10px] text-gray-400">{arrow}</span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {employees.map((e) => (
            <tr key={e.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 font-medium">
                {e.firstName} {e.lastName}
              </td>
              <td className="px-4 py-2 text-gray-600">{e.email}</td>
              <td className="px-4 py-2 text-gray-700">{e.position}</td>
              <td className="px-4 py-2 text-gray-700">{e.project.name}</td>
              <td className="px-4 py-2 text-right tabular-nums">
                {formatCurrency(e.hourlyRate)}
              </td>
              <td className="px-4 py-2">
                <StatusBadge status={e.status} />
              </td>
              <td className="px-4 py-2 text-right">
                <button
                  type="button"
                  onClick={() => onEdit(e)}
                  className="mr-2 text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(e)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
