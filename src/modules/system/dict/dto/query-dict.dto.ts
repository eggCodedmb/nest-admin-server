import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class QueryDictTypeDto extends PaginationDto {
  @ApiPropertyOptional({ description: '字典名称' })
  @IsOptional()
  @IsString()
  dictName?: string;

  @ApiPropertyOptional({ description: '字典类型' })
  @IsOptional()
  @IsString()
  dictType?: string;

  @ApiPropertyOptional({ description: '状态 (0停用 1正常)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;
}

export class QueryDictDataDto extends PaginationDto {
  @ApiPropertyOptional({ description: '字典类型' })
  @IsOptional()
  @IsString()
  dictType?: string;

  @ApiPropertyOptional({ description: '字典标签' })
  @IsOptional()
  @IsString()
  dictLabel?: string;

  @ApiPropertyOptional({ description: '状态 (0停用 1正常)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;
}
