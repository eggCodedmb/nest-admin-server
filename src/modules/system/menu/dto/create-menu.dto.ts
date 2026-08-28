import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, MaxLength, IsIn } from 'class-validator';

export class CreateMenuDto {
  @ApiPropertyOptional({ description: '父菜单ID (0为顶级)', default: 0 })
  @IsOptional()
  @IsInt()
  parentId?: number = 0;

  @ApiProperty({ description: '菜单名称' })
  @IsNotEmpty({ message: '菜单名称不能为空' })
  @IsString()
  @MaxLength(50)
  menuName: string;

  @ApiPropertyOptional({ description: '显示顺序', default: 0 })
  @IsOptional()
  @IsInt()
  orderNum?: number = 0;

  @ApiPropertyOptional({ description: '路由地址', default: '' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  path?: string = '';

  @ApiPropertyOptional({ description: '组件路径', default: '' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  component?: string;

  @ApiPropertyOptional({ description: '是否为外链 (0否 1是)', default: 0 })
  @IsOptional()
  @IsInt()
  isFrame?: number = 0;

  @ApiPropertyOptional({ description: '是否缓存 (0不缓存 1缓存)', default: 1 })
  @IsOptional()
  @IsInt()
  isCache?: number = 1;

  @ApiProperty({ description: '菜单类型 (M目录 C菜单 F按钮)' })
  @IsNotEmpty({ message: '菜单类型不能为空' })
  @IsIn(['M', 'C', 'F'], { message: '菜单类型必须为 M、C 或 F' })
  menuType: string;

  @ApiPropertyOptional({ description: '显示状态 (0隐藏 1显示)', default: 1 })
  @IsOptional()
  @IsInt()
  visible?: number = 1;

  @ApiPropertyOptional({ description: '菜单状态 (0停用 1正常)', default: 1 })
  @IsOptional()
  @IsInt()
  status?: number = 1;

  @ApiPropertyOptional({ description: '权限标识 (如: sys:user:add)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  perms?: string;

  @ApiPropertyOptional({ description: '菜单图标', default: '#' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string = '#';

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
