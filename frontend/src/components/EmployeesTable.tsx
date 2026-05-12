'use client';

import type { Employee } from '@/types/employee';
import { formatCurrency, formatNumber } from '@/lib/format';
import { StatusBadge } from './StatusBadge';

interface Props {
  employees: Employee[];
}

export function EmployeesTable({ employees }: Props) {
  if (employees.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
        No employees match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-4 py-2 font-medium">Position</th>
            <th className="px-4 py-2 font-medium">Project</th>
            <th className="px-4 py-2 font-medium text-right">Rate / h</th>
            <th className="px-4 py-2 font-medium text-right">Hours</th>
            <th className="px-4 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {employees.map((e) => (
            <tr key={e.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 font-medium">
                {e.firstName} {e.lastName}
              </td>
              <td className="px-4 py-2 text-gray-700">{e.position}</td>
              <td className="px-4 py-2 text-gray-700">{e.project}</td>
              <td className="px-4 py-2 text-right tabular-nums">
                {formatCurrency(e.hourlyRate)}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">
                {formatNumber(e.hoursWorked)}
              </td>
              <td className="px-4 py-2">
                <StatusBadge status={e.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
