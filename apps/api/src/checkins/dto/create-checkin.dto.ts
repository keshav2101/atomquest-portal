import { IsUUID, IsEnum, IsNumber, IsOptional, IsString, Min, MaxLength } from 'class-validator';
import { Quarter } from '@prisma/client';

export class CreateCheckinDto {
  @IsUUID()
  goalId: string;

  @IsEnum(Quarter)
  quarter: Quarter;

  @IsNumber() @Min(0)
  achievement: number;

  @IsOptional() @IsString() @MaxLength(1000)
  notes?: string;
}
