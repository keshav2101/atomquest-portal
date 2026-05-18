import { IsEnum, IsOptional, IsString, IsNumber, Min, Max, MaxLength } from 'class-validator';

export class ApprovalActionDto {
  @IsEnum(['APPROVE', 'REJECT'])
  action: 'APPROVE' | 'REJECT';

  @IsOptional() @IsString() @MaxLength(500)
  comment?: string;

  @IsOptional() @IsNumber() @Min(10) @Max(100)
  adjustedWeightage?: number;

  @IsOptional() @IsNumber() @Min(0)
  adjustedTarget?: number;
}
