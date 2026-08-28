import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, IsArray, MaxLength, IsEmail, ValidateIf } from 'class-validator';

export class CreateUserDto {
  @ApiPropertyOptional({ description: '部门ID' })
  @IsOptional()
  @IsInt()
  deptId?: number;

  @ApiProperty({ description: '用户账号' })
  @IsNotEmpty({ message: '用户账号不能为空' })
  @IsString()
  @MaxLength(30)
  username: string;

  @ApiProperty({ description: '用户昵称' })
  @IsNotEmpty({ message: '用户昵称不能为空' })
  @IsString()
  @MaxLength(30)
  nickname: string;

  @ApiPropertyOptional({ description: '密码 (不传则使用系统默认密码)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  password?: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsOptional()
  @ValidateIf((o) => !!o.email)
  @IsEmail({}, { message: '邮箱格式不正确' })
  @MaxLength(50)
  email?: string;

  @ApiPropertyOptional({ description: '手机号码' })
  @IsOptional()
  @IsString()
  @MaxLength(11)
  phone?: string;

  @ApiPropertyOptional({ description: '性别 (0未知 1男 2女)', default: 0 })
  @IsOptional()
  @IsInt()
  sex?: number = 0;

  @ApiPropertyOptional({ description: '头像地址' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: '状态 (0停用 1正常)', default: 1 })
  @IsOptional()
  @IsInt()
  status?: number = 1;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;

  @ApiPropertyOptional({ description: '角色ID列表', type: [Number] })
  @IsOptional()
  @IsArray()
  roleIds?: number[];
}
