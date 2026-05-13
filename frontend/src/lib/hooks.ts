'use client';

import { useCallback } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import type { SWRConfiguration } from 'swr';
import {
  ListEmployeesFilters,
  ListProjectsFilters,
  ListTimeEntriesFilters,
  employeesApi,
  projectsApi,
  timeEntriesApi,
} from './api';
import type {
  Employee,
  Paginated,
  Project,
  ProjectSummary,
  TimeEntry,
} from '@/types/employee';

const swrOptions: SWRConfiguration = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
};

function stableKey(parts: unknown[]) {
  return JSON.stringify(parts);
}

export function useEmployees(filters: ListEmployeesFilters) {
  const key = ['employees', filters];
  return useSWR<Paginated<Employee>>(
    stableKey(key),
    () => employeesApi.list(filters),
    swrOptions,
  );
}

export function useProjects(filters: ListProjectsFilters = {}) {
  const key = ['projects', filters];
  return useSWR<Paginated<Project>>(
    stableKey(key),
    () => projectsApi.list(filters),
    swrOptions,
  );
}

export function useAllProjects() {
  return useProjects({ limit: 100 });
}

export function useProjectSummary(params: {
  projectId: string | null;
  from?: string;
  to?: string;
}) {
  const enabled = !!params.projectId;
  const key = enabled
    ? stableKey(['summary', params.projectId, params.from, params.to])
    : null;
  return useSWR<ProjectSummary>(
    key,
    () =>
      employeesApi.summary({
        projectId: params.projectId!,
        from: params.from,
        to: params.to,
      }),
    swrOptions,
  );
}

export function useTimeEntries(filters: ListTimeEntriesFilters) {
  const key = ['time-entries', filters];
  return useSWR<Paginated<TimeEntry>>(
    stableKey(key),
    () => timeEntriesApi.list(filters),
    swrOptions,
  );
}

export function useInvalidate() {
  return useCallback((prefix: string) => {
    return globalMutate(
      (key) => typeof key === 'string' && key.startsWith(`["${prefix}"`),
      undefined,
      { revalidate: true },
    );
  }, []);
}
