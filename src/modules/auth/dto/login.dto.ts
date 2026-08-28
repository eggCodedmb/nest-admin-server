import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString()
  username: string;

  @ApiProperty({ description: '密码', example: 'admin123' })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: '验证码' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: '验证码唯一标识 (UUID)' })
  @IsOptional()
  @IsString()
  uuid?: string;
}
