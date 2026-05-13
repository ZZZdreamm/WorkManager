'use client';

import { useState } from 'react';
import { timeEntriesApi } from '@/lib/api';
import {
  useTimeEntries,
  useAllProjects,
  useEmployees,
  useInvalidate,
} from '@/lib/hooks';
import type { Paginated, TimeEntry, TimeEntryPayload } from '@/types/employee';
import { Modal } from '@/components/Modal';
import { TimeEntryForm } from '@/components/TimeEntryForm';
import { Pagination } from '@/components/Pagination';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';

export default function TimeEntriesPage() {
  const [page, setPage] = useState(1);
  const [projectFilter, setProjectFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const projectsQuery = useAllProjects();
  const employeesQuery = useEmployees({ limit: 100 });

  const filters = {
    projectId: projectFilter || undefined,
    employeeId: employeeFilter || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    limit: 15,
  };
  const entriesQuery = useTimeEntries(filters);
  const invalidate = useInvalidate();

  const projects = projectsQuery.data?.data ?? [];
  const employees = employeesQuery.data?.data ?? [];
  const entries = entriesQuery.data?.data ?? [];

  async function handleSubmit(payload: TimeEntryPayload) {
    await timeEntriesApi.create(payload);
    await entriesQuery.mutate();
    await invalidate('summary');
    setFormOpen(false);
  }

  async function handleDelete(entry: TimeEntry) {
    const ok = window.confirm(
      `Delete the ${entry.hours}h entry on ${formatDate(entry.date)}?`,
    );
    if (!ok) return;
    const optimistic: Paginated<TimeEntry> | undefined = entriesQuery.data
      ? {
          ...entriesQuery.data,
          total: Math.max(0, entriesQuery.data.total - 1),
          data: entriesQuery.data.data.filter((e) => e.id !== entry.id),
        }
      : undefined;
    try {
      await entriesQuery.mutate(
        timeEntriesApi.remove(entry.id).then(() => optimistic),
        {
          optimisticData: optimistic,
          rollbackOnError: true,
          populateCache: false,
          revalidate: true,
        },
      );
      await invalidate('summary');
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to delete.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Time entries</h2>
          <p className="mt-1 text-sm text-gray-500">
            Hours logged against projects. Used by the cost summary.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          disabled={employees.length === 0}
          className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          + Add entry
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-500" htmlFor="te-project">
            Project
          </label>
          <select
            id="te-project"
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value);
              setPage(1);
            }}
            className="mt-1 w-56 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm"
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
          <label className="text-xs font-medium text-gray-500" htmlFor="te-employee">
            Employee
          </label>
          <select
            id="te-employee"
            value={employeeFilter}
            onChange={(e) => {
              setEmployeeFilter(e.target.value);
              setPage(1);
            }}
            className="mt-1 w-56 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">All employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
              </option>
            ))}
          </select>
        </div>
        <label className="flex flex-col text-xs text-gray-500">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className="mt-1 rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-col text-xs text-gray-500">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className="mt-1 rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        {(projectFilter || employeeFilter || from || to) && (
          <button
            type="button"
            onClick={() => {
              setProjectFilter('');
              setEmployeeFilter('');
              setFrom('');
              setTo('');
              setPage(1);
            }}
            className="ml-auto rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
        )}
      </div>

      {entriesQuery.error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {String(entriesQuery.error.message ?? entriesQuery.error)}
        </p>
      )}

      {entriesQuery.isLoading && !entriesQuery.data ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading…
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          No time entries match the current filters.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Employee</th>
                  <th className="px-4 py-2 font-medium">Project</th>
                  <th className="px-4 py-2 font-medium text-right">Hours</th>
                  <th className="px-4 py-2 font-medium text-right">Cost</th>
                  <th className="px-4 py-2 font-medium">Description</th>
                  <th className="px-4 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((e) => {
                  const cost = Number(e.hours) * Number(e.employee.hourlyRate);
                  return (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-700">{formatDate(e.date)}</td>
                      <td className="px-4 py-2 font-medium">
                        {e.employee.firstName} {e.employee.lastName}
                      </td>
                      <td className="px-4 py-2 text-gray-700">{e.project.name}</td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {formatNumber(e.hours)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {formatCurrency(cost)}
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {e.description ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(e)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {entriesQuery.data && (
            <Pagination
              page={entriesQuery.data.page}
              totalPages={entriesQuery.data.totalPages}
              total={entriesQuery.data.total}
              limit={entriesQuery.data.limit}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <Modal
        open={formOpen}
        title="New time entry"
        onClose={() => setFormOpen(false)}
      >
        <TimeEntryForm
          employees={employees}
          onCancel={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>
    </div>
  );
}
