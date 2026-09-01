import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import {
  RecommendWeightsConfig,
  ColdStartConfig,
  DiversityConfig,
} from '../entities/recommend-rule.entity';

export class CreateRecommendRuleDto {
  @ApiProperty({ description: '策略名称' })
  @IsNotEmpty({ message: '策略名称不能为空' })
  @IsString()
  name: string;

  @ApiProperty({ description: '策略唯一标识编码' })
  @IsNotEmpty({ message: '策略编码不能为空' })
  @IsString()
  ruleCode: string;

  @ApiProperty({
    description: '算法类型 (HYBRID综合 / HOT_DECAY时效衰减 / COLD_START冷启动 / CONTENT_BASED相关度)',
    default: 'HYBRID',
  })
  @IsNotEmpty({ message: '算法类型不能为空' })
  @IsString()
  algorithmType: string;

  @ApiProperty({ description: '因子权重配置 JSON' })
  @IsNotEmpty({ message: '因子权重配置不能为空' })
  @IsObject()
  weights: RecommendWeightsConfig;

  @ApiProperty({ description: '冷启动扶持配置 JSON' })
  @IsNotEmpty({ message: '冷启动配置不能为空' })
  @IsObject()
  coldStartConfig: ColdStartConfig;

  @ApiProperty({ description: '多样性与打散配置 JSON' })
  @IsNotEmpty({ message: '多样性打散配置不能为空' })
  @IsObject()
  diversityConfig: DiversityConfig;

  @ApiPropertyOptional({ description: '状态 (0停用 1启用)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number;

  @ApiPropertyOptional({ description: '是否设为全局默认激活策略 (0否 1是)', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  isDefault?: number;

  @ApiPropertyOptional({ description: '策略描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}
