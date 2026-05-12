import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SummaryQuery {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  project!: string;
}
