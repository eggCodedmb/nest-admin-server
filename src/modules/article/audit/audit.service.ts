import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AuditLogEntity } from './entities/audit-log.entity';
import { ArticleEntity } from '../post/entities/article.entity';
import { AuditActionDto } from './dto/audit-action.dto';
import { QueryAuditDto } from './dto/query-audit.dto';
import { CategoryService } from '../category/category.service';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepo: Repository<AuditLogEntity>,
    @InjectRepository(ArticleEntity)
    private readonly articleRepo: Repository<ArticleEntity>,
    private readonly categoryService: CategoryService,
    private readonly dataSource: DataSource,
  ) {}

  // 1. 查询待审文章列表
  async page(query: QueryAuditDto) {
    const { pageNum = 1, pageSize = 10, title, categoryId, status = 1 } = query;

    const qb = this.articleRepo
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.author', 'author')
      .where('article.status = :status', { status });

    if (title) {
      qb.andWhere('article.title LIKE :title', { title: `%${title}%` });
    }

    if (categoryId) {
      const subIds = await this.categoryService.getSubCategoryIds(categoryId);
      qb.andWhere('article.category_id IN (:...subIds)', { subIds });
    }

    qb.orderBy('article.is_top', 'DESC')
      .addOrderBy('article.updated_at', 'ASC')
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

  // 2. 执行审核操作 (事务保证状态更新与日志写入一致)
  async executeAudit(dto: AuditActionDto, auditorId: number) {
    const { articleId, auditResult, auditComment } = dto;

    if (auditResult === 2 && (!auditComment || !auditComment.trim())) {
      throw new BadRequestException('审核驳回时必须填写驳回原因与修改建议');
    }

    return await this.dataSource.transaction(async (manager) => {
      const article = await manager.findOne(ArticleEntity, {
        where: { id: articleId },
      });

      if (!article) {
        throw new NotFoundException(`文章 ID ${articleId} 不存在`);
      }

      const prevStatus = article.status;
      let nextStatus = 2; // 默认通过 -> 2已发布

      if (auditResult === 1) {
        nextStatus = 2; // 审核通过 -> 已发布
        if (!article.publishedAt) {
          article.publishedAt = new Date();
        }
      } else if (auditResult === 2) {
        nextStatus = 3; // 审核驳回 -> 已驳回
      } else if (auditResult === 3) {
        nextStatus = 4; // 强制下架 -> 已下架
      }

      article.status = nextStatus;
      article.updatedBy = auditorId;
      await manager.save(article);

      // 创建审计日志
      const log = manager.create(AuditLogEntity, {
        articleId,
        auditorId,
        previousStatus: prevStatus,
        currentStatus: nextStatus,
        auditResult,
        auditComment: auditComment || (auditResult === 1 ? '审核通过，准予发布' : ''),
      });
      await manager.save(log);

      return {
        articleId,
        previousStatus: prevStatus,
        currentStatus: nextStatus,
        auditResult,
      };
    });
  }

  // 3. 查询指定文章的审核历史流转轨迹
  async getAuditLogs(articleId: number) {
    const logs = await this.auditLogRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.auditor', 'auditor')
      .where('log.article_id = :articleId', { articleId })
      .orderBy('log.created_at', 'DESC')
      .getMany();

    return logs.map((log) => ({
      ...log,
      auditorName: log.auditor?.nickname || log.auditor?.username || '系统审核员',
    }));
  }
}
