import {
  IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsUUID,
  MinLength, MaxLength, Min, Max,
} from 'class-validator';
import { UoMType } from '@prisma/client';

export class CreateGoalDto {
  @IsString() @MinLength(5) @MaxLength(200)
  title: string;

  @IsString() @MinLength(10) @MaxLength(2000)
  description: string;

  @IsString() @MinLength(1)
  thrustArea: string;

  @IsEnum(UoMType)
  uomType: UoMType;

  @IsNumber() @Min(0)
  target: number;

  @IsNumber() @Min(10) @Max(100)
  weightage: number;

  @IsString()
  timeline: string; // ISO date string

  @IsOptional() @IsBoolean()
  isShared?: boolean;

  @IsOptional() @IsUUID()
  sharedGoalId?: string;

  @IsOptional() @IsUUID()
  cycleId?: string;

  @IsOptional() @IsUUID()
  ownerId?: string; // Admin can create on behalf of employees
}
