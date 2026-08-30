import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ArticleEntity } from '../../post/entities/article.entity';
import { UserEntity } from '../../../system/user/entities/user.entity';

@Entity('art_audit_log')
export class AuditLogEntity {
  @ApiProperty({ description: '审核记录ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @ApiProperty({ description: '文章ID' })
  @Column({ name: 'article_id', type: 'bigint', unsigned: true })
  articleId: number;

  @ApiProperty({ description: '审核人ID' })
  @Column({ name: 'auditor_id', type: 'bigint', unsigned: true })
  auditorId: number;

  @ApiProperty({ description: '流转前状态' })
  @Column({ name: 'previous_status', type: 'tinyint' })
  previousStatus: number;

  @ApiProperty({ description: '流转后状态' })
  @Column({ name: 'current_status', type: 'tinyint' })
  currentStatus: number;

  @ApiProperty({ description: '审核动作 (1通过 2驳回 3下架)' })
  @Column({ name: 'audit_result', type: 'tinyint' })
  auditResult: number;

  @ApiProperty({ description: '审核批注/驳回原因', required: false })
  @Column({ name: 'audit_comment', length: 1000, nullable: true })
  auditComment: string;

  @ApiProperty({ description: '审核时间' })
  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @ManyToOne(() => ArticleEntity)
  @JoinColumn({ name: 'article_id' })
  article: ArticleEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'auditor_id' })
  auditor: UserEntity;
}
