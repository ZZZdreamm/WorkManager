import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { EmployeeStatus } from '@prisma/client';
import { PaginationQuery } from '../../common/pagination/pagination.dto';

export class ListEmployeesQuery extends PaginationQuery {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;
}
