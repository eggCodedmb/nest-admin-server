import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class QueryConfigDto extends PaginationDto {
  @ApiPropertyOptional({ description: '参数名称' })
  @IsOptional()
  @IsString()
  configName?: string;

  @ApiPropertyOptional({ description: '参数键名' })
  @IsOptional()
  @IsString()
  configKey?: string;

  @ApiPropertyOptional({ description: '系统内置 (1是 0否)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  configType?: number;

  @ApiPropertyOptional({ description: '启用状态 (1启用 0停用)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;
}
