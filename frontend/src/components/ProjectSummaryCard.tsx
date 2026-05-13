'use client';

import type { ProjectSummary } from '@/types/employee';
import { formatCurrency, formatNumber } from '@/lib/format';

interface Props {
  loading: boolean;
  error: string | null;
  summary: ProjectSummary | null;
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onClear: () => void;
}

export function ProjectSummaryCard({
  loading,
  error,
  summary,
  from,
  to,
  onFromChange,
  onToChange,
  onClear,
}: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Project cost
          </div>
          {summary ? (
            <div className="mt-1 text-base font-semibold">
              {summary.projectName}
            </div>
          ) : (
            <div className="mt-1 text-sm text-gray-500">
              Pick a project filter to see its total cost.
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col text-xs text-gray-500">
            From
            <input
              type="date"
              value={from}
              onChange={(e) => onFromChange(e.target.value)}
              className="mt-1 rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col text-xs text-gray-500">
            To
            <input
              type="date"
              value={to}
              onChange={(e) => onToChange(e.target.value)}
              className="mt-1 rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          {(from || to) && (
            <button
              type="button"
              onClick={onClear}
              className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {loading && <p className="mt-3 text-sm text-gray-500">Loading…</p>}
      {error && !loading && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
      {summary && !loading && !error && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Employees" value={String(summary.employeeCount)} />
          <Stat label="Hours" value={formatNumber(summary.totalHours)} />
          <Stat label="Total cost" value={formatCurrency(summary.totalCost)} highlight />
          <Stat
            label="Range"
            value={summary.from || summary.to ? `${summary.from ?? '…'} → ${summary.to ?? '…'}` : 'All time'}
          />
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div
        className={
          highlight
            ? 'text-lg font-semibold tabular-nums'
            : 'tabular-nums text-gray-800'
        }
      >
        {value}
      </div>
    </div>
  );
}
