import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class SummaryQuery {
  @IsUUID()
  projectId!: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
