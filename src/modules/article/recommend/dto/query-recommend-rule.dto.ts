import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class QueryRecommendRuleDto extends PaginationDto {
  @ApiPropertyOptional({ description: '策略名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '算法类型' })
  @IsOptional()
  @IsString()
  algorithmType?: string;

  @ApiPropertyOptional({ description: '状态 (0停用 1启用)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number;
}
