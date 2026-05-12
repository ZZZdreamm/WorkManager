'use client';

import { EMPLOYEE_STATUSES, EmployeeStatus, STATUS_LABELS } from '@/types/employee';

interface Props {
  project: string;
  status: EmployeeStatus | '';
  projects: string[];
  onProjectChange: (value: string) => void;
  onStatusChange: (value: EmployeeStatus | '') => void;
  onReset: () => void;
}

export function Filters({
  project,
  status,
  projects,
  onProjectChange,
  onStatusChange,
  onReset,
}: Props) {
  const hasFilters = project !== '' || status !== '';

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-col">
        <label className="text-xs font-medium text-gray-500" htmlFor="filter-project">
          Project
        </label>
        <input
          id="filter-project"
          list="project-suggestions"
          value={project}
          onChange={(e) => onProjectChange(e.target.value)}
          placeholder="All projects"
          className="mt-1 w-56 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm"
        />
        <datalist id="project-suggestions">
          {projects.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
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
