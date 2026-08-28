import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, MaxLength } from 'class-validator';

export class CreateDeptDto {
  @ApiPropertyOptional({ description: '父部门ID (0为顶级)', default: 0 })
  @IsOptional()
  @IsInt({ message: 'parentId 必须为整数' })
  parentId?: number = 0;

  @ApiProperty({ description: '部门名称' })
  @IsNotEmpty({ message: '部门名称不能为空' })
  @IsString()
  @MaxLength(50, { message: '部门名称长度不能超过 50 个字符' })
  deptName: string;

  @ApiPropertyOptional({ description: '显示顺序', default: 0 })
  @IsOptional()
  @IsInt({ message: 'orderNum 必须为整数' })
  orderNum?: number = 0;

  @ApiPropertyOptional({ description: '负责人' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  leader?: string;

  @ApiPropertyOptional({ description: '联系电话' })
  @IsOptional()
  @IsString()
  @MaxLength(11)
  phone?: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  email?: string;

  @ApiPropertyOptional({ description: '部门状态 (0停用 1正常)', default: 1 })
  @IsOptional()
  @IsInt()
  status?: number = 1;
}
