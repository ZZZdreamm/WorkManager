import { EmployeeStatus, STATUS_LABELS } from '@/types/employee';

const STYLES: Record<EmployeeStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  INACTIVE: 'bg-gray-100 text-gray-600 ring-gray-200',
  ON_LEAVE: 'bg-amber-50 text-amber-700 ring-amber-200',
};

export function StatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
