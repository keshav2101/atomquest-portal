import { IsString, IsEmail, IsEnum, IsUUID, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString() @MinLength(2) @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsString() @MinLength(8)
  @Matches(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/[0-9]/, { message: 'Password must contain at least one number' })
  password: string;

  @IsEnum(Role)
  role: Role;

  @IsUUID()
  departmentId: string;

  @IsOptional() @IsUUID()
  managerId?: string;

  @IsString() @MinLength(1) @MaxLength(20)
  employeeId: string;
}
