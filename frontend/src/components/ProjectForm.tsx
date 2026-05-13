'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Project, ProjectPayload, ProjectStatus } from '@/types/employee';
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from '@/types/employee';

interface Props {
  initial?: Project | null;
  onCancel: () => void;
  onSubmit: (payload: ProjectPayload) => Promise<void>;
}

interface FormState {
  name: string;
  client: string;
  budget: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
}

const emptyForm: FormState = {
  name: '',
  client: '',
  budget: '',
  startDate: '',
  endDate: '',
  status: 'ACTIVE',
};

function fromProject(p: Project): FormState {
  return {
    name: p.name,
    client: p.client ?? '',
    budget: p.budget ?? '',
    startDate: p.startDate ? p.startDate.slice(0, 10) : '',
    endDate: p.endDate ? p.endDate.slice(0, 10) : '',
    status: p.status,
  };
}

export function ProjectForm({ initial, onCancel, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>(
    initial ? fromProject(initial) : emptyForm,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(initial ? fromProject(initial) : emptyForm);
    setError(null);
  }, [initial]);

  const update =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload: ProjectPayload = {
      name: form.name.trim(),
      status: form.status,
    };
    if (form.client.trim()) payload.client = form.client.trim();
    if (form.budget) {
      const n = Number(form.budget);
      if (Number.isNaN(n) || n < 0) {
        setError('Budget must be a non-negative number.');
        return;
      }
      payload.budget = n;
    }
    if (form.startDate) payload.startDate = form.startDate;
    if (form.endDate) payload.endDate = form.endDate;

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Name">
        <input
          required
          maxLength={120}
          value={form.name}
          onChange={(e) => update('name')(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
        />
      </Field>

      <Field label="Client">
        <input
          maxLength={120}
          value={form.client}
          onChange={(e) => update('client')(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Budget (PLN)">
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.budget}
            onChange={(e) => update('budget')(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
          />
        </Field>
        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => update('status')(e.target.value as ProjectStatus)}
            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date">
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => update('startDate')(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
          />
        </Field>
        <Field label="End date">
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => update('endDate')(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
          />
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
