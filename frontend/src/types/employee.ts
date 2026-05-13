export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export const EMPLOYEE_STATUSES: EmployeeStatus[] = [
  'ACTIVE',
  'INACTIVE',
  'ON_LEAVE',
];

export const PROJECT_STATUSES: ProjectStatus[] = ['ACTIVE', 'ARCHIVED'];

export const STATUS_LABELS: Record<EmployeeStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ON_LEAVE: 'On leave',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
};

export interface ProjectRef {
  id: string;
  name: string;
  status: ProjectStatus;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  projectId: string;
  project: ProjectRef;
  hourlyRate: string;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface EmployeePayload {
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  projectId: string;
  hourlyRate: number;
  status: EmployeeStatus;
}

export interface Project {
  id: string;
  name: string;
  client: string | null;
  budget: string | null;
  startDate: string | null;
  endDate: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProjectPayload {
  name: string;
  client?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  status?: ProjectStatus;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  projectId: string;
  date: string;
  hours: string;
  description: string | null;
  createdAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    hourlyRate: string;
  };
  project: { id: string; name: string };
}

export interface TimeEntryPayload {
  employeeId: string;
  date: string;
  hours: number;
  description?: string;
}

export interface ProjectSummary {
  projectId: string;
  projectName: string;
  from: string | null;
  to: string | null;
  employeeCount: number;
  totalHours: number;
  totalCost: number;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuditLogEntry {
  id: string;
  entity: string;
  entityId: string;
  action: AuditAction;
  changes: Record<string, unknown>;
  createdAt: string;
}
