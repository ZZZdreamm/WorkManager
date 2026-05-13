'use client';

import type { ProjectSummary } from '@/types/employee';
import { formatCurrency, formatNumber } from '@/lib/format';

interface Props {
  loading: boolean;
  error: string | null;
  summary: ProjectSummary | null;
}

export function ProjectSummaryCard({ loading, error, summary }: Props) {
  if (!summary && !loading && !error) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
        Pick a project filter to see its total cost.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Project cost
      </div>
      {loading && <p className="mt-2 text-sm text-gray-500">Loading…</p>}
      {error && !loading && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      {summary && !loading && !error && (
        <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <div>
            <div className="text-xs text-gray-500">Project</div>
            <div className="font-medium">{summary.projectName}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Employees</div>
            <div className="tabular-nums">{summary.employeeCount}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Hours</div>
            <div className="tabular-nums">{formatNumber(summary.totalHours)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Total cost</div>
            <div className="text-lg font-semibold tabular-nums">
              {formatCurrency(summary.totalCost)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
