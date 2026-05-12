'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { employeesApi } from '@/lib/api';
import type {
  Employee,
  EmployeePayload,
  EmployeeStatus,
  ProjectSummary,
} from '@/types/employee';
import { Filters } from '@/components/Filters';
import { EmployeesTable } from '@/components/EmployeesTable';
import { Modal } from '@/components/Modal';
import { EmployeeForm } from '@/components/EmployeeForm';
import { ProjectSummaryCard } from '@/components/ProjectSummaryCard';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | ''>('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const data = await employeesApi.list({
        project: projectFilter || undefined,
        status: statusFilter || undefined,
      });
      setEmployees(data);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Failed to load employees.');
    } finally {
      setLoading(false);
    }
  }, [projectFilter, statusFilter]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    if (!projectFilter) {
      setSummary(null);
      setSummaryError(null);
      return;
    }
    let cancelled = false;
    setSummaryLoading(true);
    setSummaryError(null);
    employeesApi
      .summary(projectFilter)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setSummaryError(
            err instanceof Error ? err.message : 'Failed to load summary.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectFilter, employees]);

  const projects = useMemo(() => {
    const set = new Set<string>();
    for (const e of employees) set.add(e.project);
    return Array.from(set).sort();
  }, [employees]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setEditing(employee);
    setFormOpen(true);
  };

  const closeForm = () => setFormOpen(false);

  async function handleSubmit(payload: EmployeePayload) {
    if (editing) {
      await employeesApi.update(editing.id, payload);
    } else {
      await employeesApi.create(payload);
    }
    setFormOpen(false);
    await loadEmployees();
  }

  async function handleDelete(employee: Employee) {
    const ok = window.confirm(
      `Delete ${employee.firstName} ${employee.lastName}?`,
    );
    if (!ok) return;
    try {
      await employeesApi.remove(employee.id);
      await loadEmployees();
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
          className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New employee
        </button>
      </div>

      <Filters
        project={projectFilter}
        status={statusFilter}
        projects={projects}
        onProjectChange={setProjectFilter}
        onStatusChange={setStatusFilter}
        onReset={() => {
          setProjectFilter('');
          setStatusFilter('');
        }}
      />

      <ProjectSummaryCard
        loading={summaryLoading}
        error={summaryError}
        summary={summary}
      />

      {listError && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {listError}
        </p>
      )}

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading…
        </div>
      ) : (
        <EmployeesTable
          employees={employees}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <Modal
        open={formOpen}
        title={editing ? 'Edit employee' : 'New employee'}
        onClose={closeForm}
      >
        <EmployeeForm
          initial={editing}
          onCancel={closeForm}
          onSubmit={handleSubmit}
        />
      </Modal>
    </div>
  );
}
