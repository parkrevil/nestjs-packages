import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { UserRole } from './enums';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @Type(() => Number)
  @IsNumber()
  age: number;

  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
