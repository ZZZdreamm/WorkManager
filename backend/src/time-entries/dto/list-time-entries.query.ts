import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { PaginationQuery } from '../../common/pagination/pagination.dto';

export class ListTimeEntriesQuery extends PaginationQuery {
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
