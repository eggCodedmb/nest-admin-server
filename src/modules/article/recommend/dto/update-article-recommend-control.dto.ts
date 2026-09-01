import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateArticleRecommendControlDto {
  @ApiPropertyOptional({ description: '是否推荐 (0否 1是)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  isRecommend?: number;

  @ApiPropertyOptional({ description: '推荐权重干预分值 (-100 ~ +100)', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  recommendWeight?: number;

  @ApiPropertyOptional({
    description: '推荐干预模式 (0默认算法 1强制强推 2算法屏蔽禁推 3冷启动强制扶持)',
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  recommendFactor?: number;

  @ApiPropertyOptional({ description: '推荐干预有效截止时间 (ISO 时间字符串或 Date)' })
  @IsOptional()
  recommendExpireAt?: Date | null;
}
