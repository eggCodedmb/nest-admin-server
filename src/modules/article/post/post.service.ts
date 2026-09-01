import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleEntity } from './entities/article.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { CategoryService } from '../category/category.service';
import { parseMarkdownToc } from './utils/toc-parser.util';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly postRepo: Repository<ArticleEntity>,
    private readonly categoryService: CategoryService,
  ) {}

  // 1. 分页查询文章列表
  async page(query: QueryPostDto, currentUser?: any) {
    const {
      pageNum = 1,
      pageSize = 10,
      title,
      categoryId,
      status,
      isTop,
      isRecommend,
      recommendFactor,
      authorId,
    } = query;

    const qb = this.postRepo
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.author', 'author');

    if (title) {
      qb.andWhere('article.title LIKE :title', { title: `%${title}%` });
    }

    if (categoryId) {
      const subCategoryIds = await this.categoryService.getSubCategoryIds(categoryId);
      qb.andWhere('article.category_id IN (:...subCategoryIds)', { subCategoryIds });
    }

    if (status !== undefined && status !== null) {
      qb.andWhere('article.status = :status', { status });
    }

    if (isTop !== undefined && isTop !== null) {
      qb.andWhere('article.is_top = :isTop', { isTop });
    }

    if (isRecommend !== undefined && isRecommend !== null) {
      qb.andWhere('article.is_recommend = :isRecommend', { isRecommend });
    }

    if (recommendFactor !== undefined && recommendFactor !== null) {
      qb.andWhere('article.recommend_factor = :recommendFactor', { recommendFactor });
    }

    if (authorId) {
      qb.andWhere('article.author_id = :authorId', { authorId });
    }

    // 默认按置顶优先、创建时间倒序排序
    qb.orderBy('article.is_top', 'DESC')
      .addOrderBy('article.id', 'DESC')
      .skip((pageNum - 1) * pageSize)
      .take(pageSize);

    const [rows, total] = await qb.getManyAndCount();

    const formattedRows = rows.map((item) => ({
      ...item,
      authorName: item.author?.nickname || item.author?.username || '未知作者',
      categoryName: item.category?.name || '未分类',
    }));

    return { rows: formattedRows, total };
  }

  // 2. 查询文章详情
  async findOne(id: number): Promise<any> {
    const article = await this.postRepo.findOne({
      where: { id },
      relations: { category: true, author: true },
    });

    if (!article) {
      throw new NotFoundException(`文章 ID ${id} 不存在`);
    }

    return {
      ...article,
      authorName: article.author?.nickname || article.author?.username || '未知作者',
      categoryName: article.category?.name || '未分类',
    };
  }

  // 3. 新增文章 / 保存草稿
  async create(dto: CreatePostDto, userId: number): Promise<ArticleEntity> {
    const tocData = parseMarkdownToc(dto.content);

    const article = this.postRepo.create({
      ...dto,
      authorId: userId,
      tocData,
      publishedAt: dto.status === 2 ? new Date() : null,
    });

    return await this.postRepo.save(article);
  }

  // 4. 更新文章
  async update(id: number, dto: UpdatePostDto, userId: number): Promise<ArticleEntity> {
    const article = await this.postRepo.findOneBy({ id });
    if (!article) {
      throw new NotFoundException(`文章 ID ${id} 不存在`);
    }

    const content = dto.content !== undefined ? dto.content : article.content;
    const tocData = parseMarkdownToc(content);

    Object.assign(article, {
      ...dto,
      tocData,
      updatedBy: userId,
    });

    if (dto.status === 2 && !article.publishedAt) {
      article.publishedAt = new Date();
    }

    return await this.postRepo.save(article);
  }

  // 5. 提交审核
  async submitAudit(id: number, userId: number): Promise<ArticleEntity> {
    const article = await this.postRepo.findOneBy({ id });
    if (!article) {
      throw new NotFoundException(`文章 ID ${id} 不存在`);
    }

    if (article.status !== 0 && article.status !== 3) {
      throw new BadRequestException('只有草稿或已驳回状态的文章可以提交审核');
    }

    article.status = 1; // 待审核
    article.updatedBy = userId;
    return await this.postRepo.save(article);
  }

  // 6. 快捷切换状态 (置顶、推荐、推荐干预、上下架)
  async updateStatus(
    id: number,
    payload: {
      status?: number;
      isTop?: number;
      isRecommend?: number;
      recommendWeight?: number;
      recommendFactor?: number;
      recommendExpireAt?: Date | null;
    },
    userId: number,
  ): Promise<ArticleEntity> {
    const article = await this.postRepo.findOneBy({ id });
    if (!article) {
      throw new NotFoundException(`文章 ID ${id} 不存在`);
    }

    if (payload.status !== undefined) {
      article.status = payload.status;
      if (payload.status === 2 && !article.publishedAt) {
        article.publishedAt = new Date();
      }
    }
    if (payload.isTop !== undefined) {
      article.isTop = payload.isTop;
    }
    if (payload.isRecommend !== undefined) {
      article.isRecommend = payload.isRecommend;
    }
    if (payload.recommendWeight !== undefined) {
      article.recommendWeight = payload.recommendWeight;
    }
    if (payload.recommendFactor !== undefined) {
      article.recommendFactor = payload.recommendFactor;
    }
    if (payload.recommendExpireAt !== undefined) {
      article.recommendExpireAt = payload.recommendExpireAt as any;
    }

    article.updatedBy = userId;
    return await this.postRepo.save(article);
  }

  // 7. 删除文章 (软删除)
  async remove(id: number, userId: number): Promise<void> {
    const article = await this.postRepo.findOneBy({ id });
    if (!article) {
      throw new NotFoundException(`文章 ID ${id} 不存在`);
    }
    await this.postRepo.softDelete(id);
  }
}
