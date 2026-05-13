import type {
  AuditLogEntry,
  Employee,
  EmployeePayload,
  EmployeeStatus,
  Paginated,
  Project,
  ProjectPayload,
  ProjectStatus,
  ProjectSummary,
  TimeEntry,
  TimeEntryPayload,
} from '@/types/employee';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

interface ApiError {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

export async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
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
      // body is not JSON
    }
    const message = Array.isArray(body?.message)
      ? body!.message.join(', ')
      : body?.message ?? res.statusText;
    const err = new Error(message);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function qs(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || value === null) continue;
    search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : '';
}

export interface ListEmployeesFilters {
  projectId?: string;
  status?: EmployeeStatus;
  page?: number;
  limit?: number;
  sort?: string;
}

export const employeesApi = {
  list(filters: ListEmployeesFilters = {}): Promise<Paginated<Employee>> {
    return request<Paginated<Employee>>(
      `/employees${qs({ ...filters })}`,
    );
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
  summary(params: {
    projectId: string;
    from?: string;
    to?: string;
  }): Promise<ProjectSummary> {
    return request<ProjectSummary>(
      `/employees/summary${qs({ ...params })}`,
    );
  },
};

export interface ListProjectsFilters {
  status?: ProjectStatus;
  page?: number;
  limit?: number;
  sort?: string;
}

export const projectsApi = {
  list(filters: ListProjectsFilters = {}): Promise<Paginated<Project>> {
    return request<Paginated<Project>>(
      `/projects${qs({ ...filters })}`,
    );
  },
  create(payload: ProjectPayload): Promise<Project> {
    return request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  update(id: string, payload: Partial<ProjectPayload>): Promise<Project> {
    return request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  remove(id: string): Promise<void> {
    return request<void>(`/projects/${id}`, { method: 'DELETE' });
  },
};

export interface ListTimeEntriesFilters {
  employeeId?: string;
  projectId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const timeEntriesApi = {
  list(
    filters: ListTimeEntriesFilters = {},
  ): Promise<Paginated<TimeEntry>> {
    return request<Paginated<TimeEntry>>(
      `/time-entries${qs({ ...filters })}`,
    );
  },
  create(payload: TimeEntryPayload): Promise<TimeEntry> {
    return request<TimeEntry>('/time-entries', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  remove(id: string): Promise<void> {
    return request<void>(`/time-entries/${id}`, { method: 'DELETE' });
  },
};

export const auditLogApi = {
  list(filters: {
    entity?: string;
    entityId?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<Paginated<AuditLogEntry>> {
    return request<Paginated<AuditLogEntry>>(
      `/audit-log${qs({ ...filters })}`,
    );
  },
};
