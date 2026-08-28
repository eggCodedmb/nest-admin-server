import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, IsArray, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: '角色名称' })
  @IsNotEmpty({ message: '角色名称不能为空' })
  @IsString()
  @MaxLength(30)
  roleName: string;

  @ApiProperty({ description: '角色权限字符 (如: admin, common)' })
  @IsNotEmpty({ message: '角色权限字符不能为空' })
  @IsString()
  @MaxLength(100)
  roleKey: string;

  @ApiPropertyOptional({ description: '显示顺序', default: 0 })
  @IsOptional()
  @IsInt()
  orderNum?: number = 0;

  @ApiPropertyOptional({ description: '数据范围 (1全部 2本部门及以下 3本部门 4仅本人 5自定义)', default: 1 })
  @IsOptional()
  @IsInt()
  dataScope?: number = 1;

  @ApiPropertyOptional({ description: '角色状态 (0停用 1正常)', default: 1 })
  @IsOptional()
  @IsInt()
  status?: number = 1;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;

  @ApiPropertyOptional({ description: '绑定的菜单ID集合', type: [Number] })
  @IsOptional()
  @IsArray()
  menuIds?: number[];

  @ApiPropertyOptional({ description: '自定义数据权限的部门ID集合', type: [Number] })
  @IsOptional()
  @IsArray()
  deptIds?: number[];
}
