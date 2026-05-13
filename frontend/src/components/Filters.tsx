'use client';

import {
  EMPLOYEE_STATUSES,
  EmployeeStatus,
  STATUS_LABELS,
  Project,
} from '@/types/employee';

interface Props {
  projectId: string;
  status: EmployeeStatus | '';
  projects: Project[];
  onProjectChange: (value: string) => void;
  onStatusChange: (value: EmployeeStatus | '') => void;
  onReset: () => void;
}

export function Filters({
  projectId,
  status,
  projects,
  onProjectChange,
  onStatusChange,
  onReset,
}: Props) {
  const hasFilters = projectId !== '' || status !== '';

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-col">
        <label className="text-xs font-medium text-gray-500" htmlFor="filter-project">
          Project
        </label>
        <select
          id="filter-project"
          value={projectId}
          onChange={(e) => onProjectChange(e.target.value)}
          className="mt-1 w-64 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label className="text-xs font-medium text-gray-500" htmlFor="filter-status">
          Status
        </label>
        <select
          id="filter-status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value as EmployeeStatus | '')}
          className="mt-1 w-44 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          {EMPLOYEE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="ml-auto rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Reset
        </button>
      )}
    </div>
  );
}
