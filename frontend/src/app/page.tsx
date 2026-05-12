'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { employeesApi } from '@/lib/api';
import type { Employee, EmployeeStatus } from '@/types/employee';
import { Filters } from '@/components/Filters';
import { EmployeesTable } from '@/components/EmployeesTable';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | ''>('');

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

  const projects = useMemo(() => {
    const set = new Set<string>();
    for (const e of employees) set.add(e.project);
    return Array.from(set).sort();
  }, [employees]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Employees</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage outsourced employees and project cost.
        </p>
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
        <EmployeesTable employees={employees} />
      )}
    </div>
  );
}
