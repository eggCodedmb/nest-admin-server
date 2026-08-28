import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class QueryRoleDto extends PaginationDto {
  @ApiPropertyOptional({ description: '角色名称' })
  @IsOptional()
  @IsString()
  roleName?: string;

  @ApiPropertyOptional({ description: '角色权限字符' })
  @IsOptional()
  @IsString()
  roleKey?: string;

  @ApiPropertyOptional({ description: '角色状态 (0停用 1正常)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;
}
