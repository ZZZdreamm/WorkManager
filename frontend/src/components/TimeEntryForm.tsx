'use client';

import { FormEvent, useState } from 'react';
import type { Employee, TimeEntryPayload } from '@/types/employee';

interface Props {
  employees: Employee[];
  onCancel: () => void;
  onSubmit: (payload: TimeEntryPayload) => Promise<void>;
}

export function TimeEntryForm({ employees, onCancel, onSubmit }: Props) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? '');
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [hours, setHours] = useState('8');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const n = Number(hours);
    if (Number.isNaN(n) || n <= 0 || n > 24) {
      setError('Hours must be between 0 and 24.');
      return;
    }
    if (!employeeId) {
      setError('Pick an employee.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        employeeId,
        date,
        hours: n,
        description: description.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Employee">
        <select
          required
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="" disabled>
            Pick an employee…
          </option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.firstName} {e.lastName} ({e.project.name})
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
          />
        </Field>
        <Field label="Hours">
          <input
            required
            type="number"
            min="0.01"
            max="24"
            step="0.25"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
          />
        </Field>
      </div>

      <Field label="Description (optional)">
        <textarea
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="h-20 w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
        />
      </Field>

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
          disabled={submitting || employees.length === 0}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Add entry'}
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
