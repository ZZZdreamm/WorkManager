import { IsEnum, IsOptional } from 'class-validator';
import { ProjectStatus } from '@prisma/client';
import { PaginationQuery } from '../../common/pagination/pagination.dto';

export class ListProjectsQuery extends PaginationQuery {
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}
