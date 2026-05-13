import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { AuditAction } from '@prisma/client';
import { PaginationQuery } from '../../common/pagination/pagination.dto';

export class ListAuditLogQuery extends PaginationQuery {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  entity?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;
}
