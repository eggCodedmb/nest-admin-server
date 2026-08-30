import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryEntity } from '../../category/entities/category.entity';
import { UserEntity } from '../../../system/user/entities/user.entity';

@Entity('art_article')
export class ArticleEntity {
  @ApiProperty({ description: '文章ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @ApiProperty({ description: '分类ID' })
  @Column({ name: 'category_id', type: 'bigint', unsigned: true })
  categoryId: number;

  @ApiProperty({ description: '作者用户ID' })
  @Column({ name: 'author_id', type: 'bigint', unsigned: true })
  authorId: number;

  @ApiProperty({ description: '文章标题' })
  @Column({ length: 200 })
  title: string;

  @ApiProperty({ description: '文章Slug', required: false })
  @Column({ length: 200, nullable: true })
  slug: string;

  @ApiProperty({ description: '文章摘要', required: false })
  @Column({ length: 500, nullable: true })
  summary: string;

  @ApiProperty({ description: '封面图片URL', required: false })
  @Column({ name: 'cover_image', length: 500, nullable: true })
  coverImage: string;

  @ApiProperty({ description: 'Markdown 源码' })
  @Column({ type: 'longtext' })
  content: string;

  @ApiProperty({ description: '渲染后的 HTML 内容', required: false })
  @Column({ name: 'content_html', type: 'longtext', nullable: true })
  contentHtml: string;

  @ApiProperty({ description: 'TOC 目录树结构 (JSON)', required: false })
  @Column({ name: 'toc_data', type: 'json', nullable: true })
  tocData: any;

  @ApiProperty({ description: '文章标签 (逗号分隔)', required: false })
  @Column({ length: 255, nullable: true })
  tags: string;

  @ApiProperty({ description: '来源 (1原创 2转载 3翻译)', default: 1 })
  @Column({ name: 'source_type', type: 'tinyint', default: 1 })
  sourceType: number;

  @ApiProperty({ description: '原文链接', required: false })
  @Column({ name: 'source_url', length: 500, nullable: true })
  sourceUrl: string;

  @ApiProperty({ description: '状态 (0草稿 1待审 2发布 3驳回 4下架)', default: 0 })
  @Column({ type: 'tinyint', default: 0 })
  status: number;

  @ApiProperty({ description: '是否置顶 (0否 1是)', default: 0 })
  @Column({ name: 'is_top', type: 'tinyint', default: 0 })
  isTop: number;

  @ApiProperty({ description: '是否推荐 (0否 1是)', default: 0 })
  @Column({ name: 'is_recommend', type: 'tinyint', default: 0 })
  isRecommend: number;

  @ApiProperty({ description: '是否允许评论 (0否 1是)', default: 1 })
  @Column({ name: 'allow_comment', type: 'tinyint', default: 1 })
  allowComment: number;

  @ApiProperty({ description: '浏览量', default: 0 })
  @Column({ name: 'view_count', type: 'bigint', unsigned: true, default: 0 })
  viewCount: number;

  @ApiProperty({ description: '点赞数', default: 0 })
  @Column({ name: 'like_count', type: 'bigint', unsigned: true, default: 0 })
  likeCount: number;

  @ApiProperty({ description: '正式发布时间', required: false })
  @Column({ name: 'published_at', type: 'datetime', precision: 3, nullable: true })
  publishedAt: Date;

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

  @ManyToOne(() => CategoryEntity)
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'author_id' })
  author: UserEntity;
}
