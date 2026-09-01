import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePostDto {
  @ApiProperty({ description: '所属分类ID' })
  @IsNotEmpty({ message: '请选择所属分类' })
  @Type(() => Number)
  @IsNumber({}, { message: '分类ID必须为数字' })
  categoryId: number;

  @ApiProperty({ description: '文章标题' })
  @IsNotEmpty({ message: '文章标题不能为空' })
  @IsString()
  @MaxLength(200, { message: '文章标题不能超过200个字符' })
  title: string;

  @ApiProperty({ description: '文章Slug', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Slug不能超过200个字符' })
  slug?: string;

  @ApiProperty({ description: '文章摘要', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '摘要不能超过500个字符' })
  summary?: string;

  @ApiProperty({ description: '封面图片URL', required: false })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiProperty({ description: 'Markdown 源码' })
  @IsNotEmpty({ message: '文章正文不能为空' })
  @IsString()
  content: string;

  @ApiProperty({ description: '渲染后的 HTML 内容', required: false })
  @IsOptional()
  @IsString()
  contentHtml?: string;

  @ApiProperty({ description: '文章标签 (逗号分隔)', required: false })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiProperty({ description: '来源 (1原创 2转载 3翻译)', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sourceType?: number;

  @ApiProperty({ description: '原文链接', required: false })
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @ApiProperty({ description: '文章状态 (0草稿 1待审 2发布 3驳回 4下架)', required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number;

  @ApiProperty({ description: '是否置顶 (0否 1是)', required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  isTop?: number;

  @ApiProperty({ description: '是否推荐 (0否 1是)', required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  isRecommend?: number;

  @ApiProperty({ description: '推荐权重干预分值 (-100~+100)', required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  recommendWeight?: number;

  @ApiProperty({ description: '推荐干预模式 (0默认算法 1强制强推 2算法屏蔽禁推 3冷启动强制扶持)', required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  recommendFactor?: number;

  @ApiProperty({ description: '推荐干预有效截止时间', required: false })
  @IsOptional()
  recommendExpireAt?: Date;

  @ApiProperty({ description: '是否允许评论 (0否 1是)', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  allowComment?: number;
}
