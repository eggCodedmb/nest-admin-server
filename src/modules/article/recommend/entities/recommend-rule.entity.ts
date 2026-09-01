import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export interface RecommendWeightsConfig {
  viewWeight: number; // 浏览量权重 (0-100)
  likeWeight: number; // 点赞数权重 (0-100)
  commentWeight: number; // 评论数权重 (0-100)
  timeDecayRate: number; // 半衰期指数 Gravity (0.1-3.0)
  tagMatchWeight: number; // 标签相关度权重 (0-100)
  categoryMatchWeight: number; // 分类相关度权重 (0-100)
  manualBoostWeight: number; // 人工推荐置顶提权加成 (0-100)
}

export interface ColdStartConfig {
  enableColdStart: boolean; // 是否开启新文冷启动扶持
  boostDays: number; // 扶持天数 (如 7 或 14 天)
  boostScoreMultiplier: number; // 扶持加成倍率 (如 1.5 ~ 2.5)
  minImpressionsThreshold: number; // 最低曝光门槛 (曝光低于此阈值享受全额扶持)
}

export interface DiversityConfig {
  maxPerCategory: number; // 单分类最大连续/单次推荐上限 (打散度)
  exploreRate: number; // 随机探索池比率 (Epsilon 0-0.3)
  dedupHistoryDays: number; // 曝光/阅读去重历史保留天数
}

@Entity('art_recommend_rule')
export class RecommendRuleEntity {
  @ApiProperty({ description: '策略规则ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @ApiProperty({ description: '策略名称' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: '策略唯一编码' })
  @Column({ name: 'rule_code', length: 60, unique: true })
  ruleCode: string;

  @ApiProperty({
    description: '算法类型 (HYBRID综合 / HOT_DECAY时效衰减 / COLD_START冷启动 / CONTENT_BASED相关度)',
    default: 'HYBRID',
  })
  @Column({ name: 'algorithm_type', length: 40, default: 'HYBRID' })
  algorithmType: string;

  @ApiProperty({ description: '因子权重配置 JSON' })
  @Column({ type: 'json' })
  weights: RecommendWeightsConfig;

  @ApiProperty({ description: '冷启动扶持配置 JSON' })
  @Column({ name: 'cold_start_config', type: 'json' })
  coldStartConfig: ColdStartConfig;

  @ApiProperty({ description: '多样性与打散配置 JSON' })
  @Column({ name: 'diversity_config', type: 'json' })
  diversityConfig: DiversityConfig;

  @ApiProperty({ description: '状态 (0停用 1启用)', default: 1 })
  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @ApiProperty({ description: '是否为全局默认激活策略 (0否 1是)', default: 0 })
  @Column({ name: 'is_default', type: 'tinyint', default: 0 })
  isDefault: number;

  @ApiProperty({ description: '策略描述', required: false })
  @Column({ length: 500, nullable: true })
  description: string;

  @ApiProperty({ description: '备注', required: false })
  @Column({ length: 500, nullable: true })
  remark: string;

  @ApiProperty({ description: '创建者ID', required: false })
  @Column({ name: 'created_by', type: 'bigint', unsigned: true, nullable: true })
  createdBy: number;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @ApiProperty({ description: '更新者ID', required: false })
  @Column({ name: 'updated_by', type: 'bigint', unsigned: true, nullable: true })
  updatedBy: number;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date;

  @ApiProperty({ description: '软删除时间', required: false })
  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', precision: 3, nullable: true })
  deletedAt: Date;
}
