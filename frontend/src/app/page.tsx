'use client';

import { useState } from 'react';
import { employeesApi } from '@/lib/api';
import { useEmployees, useAllProjects, useProjectSummary, useInvalidate } from '@/lib/hooks';
import type {
  Employee,
  EmployeePayload,
  EmployeeStatus,
  Paginated,
} from '@/types/employee';
import { Filters } from '@/components/Filters';
import { EmployeesTable } from '@/components/EmployeesTable';
import { Modal } from '@/components/Modal';
import { EmployeeForm } from '@/components/EmployeeForm';
import { ProjectSummaryCard } from '@/components/ProjectSummaryCard';
import { Pagination } from '@/components/Pagination';

export default function EmployeesPage() {
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | ''>('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('lastName:asc');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const filters = {
    projectId: projectFilter || undefined,
    status: statusFilter || undefined,
    page,
    limit: 10,
    sort,
  };

  const employeesQuery = useEmployees(filters);
  const projectsQuery = useAllProjects();
  const summaryQuery = useProjectSummary({
    projectId: projectFilter || null,
  });
  const invalidate = useInvalidate();

  const employees = employeesQuery.data?.data ?? [];
  const projects = projectsQuery.data?.data ?? [];

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(employee: Employee) {
    setEditing(employee);
    setFormOpen(true);
  }

  async function handleSubmit(payload: EmployeePayload) {
    if (editing) {
      const optimistic: Paginated<Employee> | undefined = employeesQuery.data
        ? {
            ...employeesQuery.data,
            data: employeesQuery.data.data.map((e) =>
              e.id === editing.id
                ? {
                    ...e,
                    ...payload,
                    hourlyRate: String(payload.hourlyRate),
                    project:
                      projects.find((p) => p.id === payload.projectId) ??
                      e.project,
                  }
                : e,
            ),
          }
        : undefined;
      await employeesQuery.mutate(
        employeesApi.update(editing.id, payload).then(() => optimistic),
        {
          optimisticData: optimistic,
          rollbackOnError: true,
          populateCache: false,
          revalidate: true,
        },
      );
    } else {
      await employeesApi.create(payload);
      await employeesQuery.mutate();
    }
    setFormOpen(false);
    await invalidate('summary');
  }

  async function handleDelete(employee: Employee) {
    const ok = window.confirm(
      `Delete ${employee.firstName} ${employee.lastName}?`,
    );
    if (!ok) return;
    const optimistic: Paginated<Employee> | undefined = employeesQuery.data
      ? {
          ...employeesQuery.data,
          total: Math.max(0, employeesQuery.data.total - 1),
          data: employeesQuery.data.data.filter((e) => e.id !== employee.id),
        }
      : undefined;
    try {
      await employeesQuery.mutate(
        employeesApi.remove(employee.id).then(() => optimistic),
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
          <h2 className="text-2xl font-semibold tracking-tight">Employees</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage outsourced employees and project cost.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={projects.length === 0}
          className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          title={projects.length === 0 ? 'Create a project first' : ''}
        >
          + New employee
        </button>
      </div>

      <Filters
        projectId={projectFilter}
        status={statusFilter}
        projects={projects}
        onProjectChange={(value) => {
          setProjectFilter(value);
          setPage(1);
        }}
        onStatusChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        onReset={() => {
          setProjectFilter('');
          setStatusFilter('');
          setPage(1);
        }}
      />

      <ProjectSummaryCard
        loading={summaryQuery.isLoading}
        error={summaryQuery.error ? String(summaryQuery.error.message ?? summaryQuery.error) : null}
        summary={summaryQuery.data ?? null}
      />

      {employeesQuery.error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {String(employeesQuery.error.message ?? employeesQuery.error)}
        </p>
      )}

      {employeesQuery.isLoading && !employeesQuery.data ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading…
        </div>
      ) : (
        <>
          <EmployeesTable
            employees={employees}
            sort={sort}
            onSortChange={(s) => {
              setSort(s);
              setPage(1);
            }}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
          {employeesQuery.data && (
            <Pagination
              page={employeesQuery.data.page}
              totalPages={employeesQuery.data.totalPages}
              total={employeesQuery.data.total}
              limit={employeesQuery.data.limit}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <Modal
        open={formOpen}
        title={editing ? 'Edit employee' : 'New employee'}
        onClose={() => setFormOpen(false)}
      >
        <EmployeeForm
          initial={editing}
          projects={projects}
          onCancel={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>
    </div>
  );
}
