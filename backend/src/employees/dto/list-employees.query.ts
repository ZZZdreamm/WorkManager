import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { EmployeeStatus } from '@prisma/client';

export class ListEmployeesQuery {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  project?: string;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;
}
