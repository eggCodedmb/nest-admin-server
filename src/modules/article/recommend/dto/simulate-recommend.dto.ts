import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsObject, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import {
  RecommendWeightsConfig,
  ColdStartConfig,
  DiversityConfig,
} from '../entities/recommend-rule.entity';

export class SimulateRecommendDto {
  @ApiProperty({ description: '因子权重配置 JSON' })
  @IsNotEmpty({ message: '因子权重配置不能为空' })
  @IsObject()
  weights: RecommendWeightsConfig;

  @ApiPropertyOptional({ description: '冷启动扶持配置 JSON' })
  @IsOptional()
  @IsObject()
  coldStartConfig?: ColdStartConfig;

  @ApiPropertyOptional({ description: '多样性打散配置 JSON' })
  @IsOptional()
  @IsObject()
  diversityConfig?: DiversityConfig;

  @ApiPropertyOptional({ description: '模拟返回条数', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: '上下文分类ID (用于测试内容相关度协同加权)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  contextCategoryId?: number;

  @ApiPropertyOptional({ description: '上下文标签 (逗号分隔，用于测试标签契合度)' })
  @IsOptional()
  contextTags?: string;
}
