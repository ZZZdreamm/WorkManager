'use client';

import { useState } from 'react';
import { projectsApi } from '@/lib/api';
import { useProjects, useInvalidate } from '@/lib/hooks';
import type { Project, ProjectPayload, ProjectStatus, Paginated } from '@/types/employee';
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from '@/types/employee';
import { Modal } from '@/components/Modal';
import { ProjectForm } from '@/components/ProjectForm';
import { Pagination } from '@/components/Pagination';
import { formatCurrency, formatDate } from '@/lib/format';

export default function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const filters = {
    status: statusFilter || undefined,
    page,
    limit: 10,
  };
  const projectsQuery = useProjects(filters);
  const invalidate = useInvalidate();

  const projects = projectsQuery.data?.data ?? [];

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(project: Project) {
    setEditing(project);
    setFormOpen(true);
  }

  async function handleSubmit(payload: ProjectPayload) {
    if (editing) {
      const optimistic: Paginated<Project> | undefined = projectsQuery.data
        ? {
            ...projectsQuery.data,
            data: projectsQuery.data.data.map((p) =>
              p.id === editing.id
                ? {
                    ...p,
                    ...payload,
                    budget: payload.budget != null ? String(payload.budget) : p.budget,
                  }
                : p,
            ),
          }
        : undefined;
      await projectsQuery.mutate(
        projectsApi.update(editing.id, payload).then(() => optimistic),
        {
          optimisticData: optimistic,
          rollbackOnError: true,
          populateCache: false,
          revalidate: true,
        },
      );
    } else {
      await projectsApi.create(payload);
      await projectsQuery.mutate();
    }
    setFormOpen(false);
    await invalidate('summary');
  }

  async function handleDelete(project: Project) {
    const ok = window.confirm(`Delete project "${project.name}"?`);
    if (!ok) return;
    const optimistic: Paginated<Project> | undefined = projectsQuery.data
      ? {
          ...projectsQuery.data,
          total: Math.max(0, projectsQuery.data.total - 1),
          data: projectsQuery.data.data.filter((p) => p.id !== project.id),
        }
      : undefined;
    try {
      await projectsQuery.mutate(
        projectsApi.remove(project.id).then(() => optimistic),
        {
          optimisticData: optimistic,
          rollbackOnError: true,
          populateCache: false,
          revalidate: true,
        },
      );
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to delete.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
          <p className="mt-1 text-sm text-gray-500">
            Catalogue of projects with client, budget and dates.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New project
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-500" htmlFor="filter-project-status">
            Status
          </label>
          <select
            id="filter-project-status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ProjectStatus | '');
              setPage(1);
            }}
            className="mt-1 w-44 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">All statuses</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {projectsQuery.error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {String(projectsQuery.error.message ?? projectsQuery.error)}
        </p>
      )}

      {projectsQuery.isLoading && !projectsQuery.data ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading…
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          No projects yet.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Client</th>
                  <th className="px-4 py-2 font-medium text-right">Budget</th>
                  <th className="px-4 py-2 font-medium">Start</th>
                  <th className="px-4 py-2 font-medium">End</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{p.name}</td>
                    <td className="px-4 py-2 text-gray-700">{p.client ?? '—'}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {formatCurrency(p.budget)}
                    </td>
                    <td className="px-4 py-2 text-gray-700">{formatDate(p.startDate)}</td>
                    <td className="px-4 py-2 text-gray-700">{formatDate(p.endDate)}</td>
                    <td className="px-4 py-2 text-gray-700">
                      {PROJECT_STATUS_LABELS[p.status]}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="mr-2 text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
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
          {projectsQuery.data && (
            <Pagination
              page={projectsQuery.data.page}
              totalPages={projectsQuery.data.totalPages}
              total={projectsQuery.data.total}
              limit={projectsQuery.data.limit}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <Modal
        open={formOpen}
        title={editing ? 'Edit project' : 'New project'}
        onClose={() => setFormOpen(false)}
      >
        <ProjectForm
          initial={editing}
          onCancel={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>
    </div>
  );
}
