import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsString()
  sort?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function buildOrderBy<TField extends string>(
  sort: string | undefined,
  allowed: readonly TField[],
  fallback: Array<Partial<Record<TField, 'asc' | 'desc'>>>,
): Array<Record<string, 'asc' | 'desc'>> {
  if (!sort) return fallback as Array<Record<string, 'asc' | 'desc'>>;
  const [rawField, rawDir] = sort.split(':');
  const field = rawField as TField;
  if (!allowed.includes(field)) {
    return fallback as Array<Record<string, 'asc' | 'desc'>>;
  }
  const dir: 'asc' | 'desc' = rawDir === 'desc' ? 'desc' : 'asc';
  return [{ [field]: dir }];
}

export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
