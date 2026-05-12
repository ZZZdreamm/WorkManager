export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

export const EMPLOYEE_STATUSES: EmployeeStatus[] = [
  'ACTIVE',
  'INACTIVE',
  'ON_LEAVE',
];

export const STATUS_LABELS: Record<EmployeeStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ON_LEAVE: 'On leave',
};

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  project: string;
  hourlyRate: string;
  hoursWorked: number;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeePayload {
  firstName: string;
  lastName: string;
  position: string;
  project: string;
  hourlyRate: number;
  hoursWorked: number;
  status: EmployeeStatus;
}

export interface ProjectSummary {
  project: string;
  employeeCount: number;
  totalHours: number;
  totalCost: number;
}
