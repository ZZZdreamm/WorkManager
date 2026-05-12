import type {
  Employee,
  EmployeePayload,
  EmployeeStatus,
  ProjectSummary,
} from '@/types/employee';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

interface ApiError {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    let body: ApiError | null = null;
    try {
      body = (await res.json()) as ApiError;
    } catch {
      // body not JSON
    }
    const message = Array.isArray(body?.message)
      ? body!.message.join(', ')
      : body?.message ?? res.statusText;
    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export interface ListEmployeesFilters {
  project?: string;
  status?: EmployeeStatus;
}

export const employeesApi = {
  list(filters: ListEmployeesFilters = {}): Promise<Employee[]> {
    const params = new URLSearchParams();
    if (filters.project) params.set('project', filters.project);
    if (filters.status) params.set('status', filters.status);
    const qs = params.toString();
    return request<Employee[]>(`/employees${qs ? `?${qs}` : ''}`);
  },

  create(payload: EmployeePayload): Promise<Employee> {
    return request<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update(id: string, payload: Partial<EmployeePayload>): Promise<Employee> {
    return request<Employee>(`/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  remove(id: string): Promise<void> {
    return request<void>(`/employees/${id}`, { method: 'DELETE' });
  },

  summary(project: string): Promise<ProjectSummary> {
    const params = new URLSearchParams({ project });
    return request<ProjectSummary>(`/employees/summary?${params.toString()}`);
  },
};
