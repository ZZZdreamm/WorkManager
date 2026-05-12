import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmployeeStatus } from '@prisma/client';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  position!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  project!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000)
  hourlyRate!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000)
  hoursWorked: number = 0;

  @IsEnum(EmployeeStatus)
  status: EmployeeStatus = EmployeeStatus.ACTIVE;
}
