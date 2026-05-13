'use client';

interface Props {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: Props) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between gap-3 text-sm text-gray-600">
      <span>
        {total === 0
          ? 'No results'
          : `Showing ${from}–${to} of ${total}`}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded border border-gray-300 px-2 py-1 disabled:opacity-50"
        >
          ← Prev
        </button>
        <span className="px-2 tabular-nums">
          Page {page} / {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="rounded border border-gray-300 px-2 py-1 disabled:opacity-50"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
