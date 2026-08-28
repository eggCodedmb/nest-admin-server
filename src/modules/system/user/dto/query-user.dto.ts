import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class QueryUserDto extends PaginationDto {
  @ApiPropertyOptional({ description: '用户账号' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: '用户昵称' })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({ description: '手机号码' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '部门ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  deptId?: number;

  @ApiPropertyOptional({ description: '帐号状态 (0停用 1正常)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;
}
