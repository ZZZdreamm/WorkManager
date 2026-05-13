'use client';

import { FormEvent, useEffect, useState } from 'react';
import type {
  Employee,
  EmployeePayload,
  EmployeeStatus,
  Project,
} from '@/types/employee';
import { EMPLOYEE_STATUSES, STATUS_LABELS } from '@/types/employee';

interface Props {
  initial?: Employee | null;
  projects: Project[];
  onCancel: () => void;
  onSubmit: (payload: EmployeePayload) => Promise<void>;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  projectId: string;
  hourlyRate: string;
  status: EmployeeStatus;
}

function emptyForm(defaultProjectId = ''): FormState {
  return {
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    projectId: defaultProjectId,
    hourlyRate: '',
    status: 'ACTIVE',
  };
}

function fromEmployee(e: Employee): FormState {
  return {
    firstName: e.firstName,
    lastName: e.lastName,
    email: e.email,
    position: e.position,
    projectId: e.projectId,
    hourlyRate: String(e.hourlyRate),
    status: e.status,
  };
}

export function EmployeeForm({ initial, projects, onCancel, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>(
    initial ? fromEmployee(initial) : emptyForm(projects[0]?.id ?? ''),
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(initial ? fromEmployee(initial) : emptyForm(projects[0]?.id ?? ''));
    setError(null);
  }, [initial, projects]);

  const update =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const hourlyRate = Number(form.hourlyRate);
    if (Number.isNaN(hourlyRate) || hourlyRate < 0) {
      setError('Hourly rate must be a non-negative number.');
      return;
    }
    if (!form.projectId) {
      setError('Project is required.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        position: form.position.trim(),
        projectId: form.projectId,
        hourlyRate,
        status: form.status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name">
          <input
            required
            maxLength={80}
            value={form.firstName}
            onChange={(e) => update('firstName')(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
          />
        </Field>
        <Field label="Last name">
          <input
            required
            maxLength={80}
            value={form.lastName}
            onChange={(e) => update('lastName')(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
          />
        </Field>
      </div>

      <Field label="Email">
        <input
          required
          type="email"
          maxLength={160}
          value={form.email}
          onChange={(e) => update('email')(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
        />
      </Field>

      <Field label="Position">
        <input
          required
          maxLength={120}
          value={form.position}
          onChange={(e) => update('position')(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
        />
      </Field>

      <Field label="Project">
        <select
          required
          value={form.projectId}
          onChange={(e) => update('projectId')(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="" disabled>
            Select a project…
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Hourly rate (PLN)">
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.hourlyRate}
            onChange={(e) => update('hourlyRate')(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
          />
        </Field>
        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => update('status')(e.target.value as EmployeeStatus)}
            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
          >
            {EMPLOYEE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : initial ? 'Save changes' : 'Create'}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      {children}
    </label>
  );
}
