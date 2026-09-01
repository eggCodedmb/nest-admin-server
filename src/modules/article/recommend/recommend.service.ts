import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RecommendRuleEntity,
  RecommendWeightsConfig,
  ColdStartConfig,
  DiversityConfig,
} from './entities/recommend-rule.entity';
import { ArticleEntity } from '../post/entities/article.entity';
import { CreateRecommendRuleDto } from './dto/create-recommend-rule.dto';
import { UpdateRecommendRuleDto } from './dto/update-recommend-rule.dto';
import { QueryRecommendRuleDto } from './dto/query-recommend-rule.dto';
import { SimulateRecommendDto } from './dto/simulate-recommend.dto';
import { UpdateArticleRecommendControlDto } from './dto/update-article-recommend-control.dto';

export interface ScoreBreakdown {
  interactionScore: number;
  viewComponent: number;
  likeComponent: number;
  commentComponent: number;
  timeDecayFactor: number;
  hoursSincePublish: number;
  coldStartMultiplier: number;
  isColdStartApplied: boolean;
  manualBoostScore: number;
  relevanceScore: number;
  finalScore: number;
}

export interface RecommendedArticleItem {
  id: number;
  title: string;
  summary: string;
  coverImage: string;
  categoryId: number;
  categoryName: string;
  authorId: number;
  authorName: string;
  tags: string;
  viewCount: number;
  likeCount: number;
  publishedAt: Date;
  isTop: number;
  isRecommend: number;
  recommendWeight: number;
  recommendFactor: number;
  recommendExpireAt: Date | null;
  scoreBreakdown: ScoreBreakdown;
  simulatedRank?: number;
  rankDelta?: number; // 排名升降变动 (+2 / -1 / 0)
}

@Injectable()
export class RecommendService {
  constructor(
    @InjectRepository(RecommendRuleEntity)
    private readonly ruleRepo: Repository<RecommendRuleEntity>,
    @InjectRepository(ArticleEntity)
    private readonly articleRepo: Repository<ArticleEntity>,
  ) {}

  // 1. 分页查询策略列表
  async page(query: QueryRecommendRuleDto) {
    const { pageNum = 1, pageSize = 10, name, algorithmType, status } = query;
    const qb = this.ruleRepo.createQueryBuilder('rule');

    if (name) {
      qb.andWhere('rule.name LIKE :name', { name: `%${name}%` });
    }
    if (algorithmType) {
      qb.andWhere('rule.algorithm_type = :algorithmType', { algorithmType });
    }
    if (status !== undefined && status !== null) {
      qb.andWhere('rule.status = :status', { status });
    }

    qb.orderBy('rule.is_default', 'DESC')
      .addOrderBy('rule.id', 'DESC')
      .skip((pageNum - 1) * pageSize)
      .take(pageSize);

    const [rows, total] = await qb.getManyAndCount();
    return { rows, total };
  }

  // 2. 查询所有启用的策略列表
  async findAll() {
    return await this.ruleRepo.find({
      where: { status: 1 },
      order: { isDefault: 'DESC', id: 'ASC' },
    });
  }

  // 3. 获取单个策略详情
  async findOne(id: number): Promise<RecommendRuleEntity> {
    const rule = await this.ruleRepo.findOneBy({ id });
    if (!rule) {
      throw new NotFoundException(`策略规则 ID ${id} 不存在`);
    }
    return rule;
  }

  // 4. 获取当前全局默认激活策略 (若无则返回内置缺省策略)
  async getActiveConfig(): Promise<RecommendRuleEntity> {
    const active = await this.ruleRepo.findOne({
      where: { isDefault: 1, status: 1 },
    });
    if (active) {
      return active;
    }

    // 尝试获取任意一条启用规则
    const anyActive = await this.ruleRepo.findOne({
      where: { status: 1 },
      order: { id: 'ASC' },
    });
    if (anyActive) {
      return anyActive;
    }

    // 内存内置缺省策略保底
    return {
      id: 0,
      name: '系统内置默认综合推荐算法',
      ruleCode: 'DEFAULT_BUILTIN',
      algorithmType: 'HYBRID',
      weights: {
        viewWeight: 20,
        likeWeight: 40,
        commentWeight: 30,
        timeDecayRate: 1.5,
        tagMatchWeight: 35,
        categoryMatchWeight: 30,
        manualBoostWeight: 50,
      },
      coldStartConfig: {
        enableColdStart: true,
        boostDays: 7,
        boostScoreMultiplier: 1.6,
        minImpressionsThreshold: 200,
      },
      diversityConfig: {
        maxPerCategory: 3,
        exploreRate: 0.1,
        dedupHistoryDays: 7,
      },
      status: 1,
      isDefault: 1,
      description: '内存内置缺省兜底策略',
      remark: '',
      createdBy: 1,
      createdAt: new Date(),
      updatedBy: 1,
      updatedAt: new Date(),
      deletedAt: null as any,
    } as RecommendRuleEntity;
  }

  // 5. 新建策略规则
  async create(dto: CreateRecommendRuleDto, userId: number): Promise<RecommendRuleEntity> {
    const exists = await this.ruleRepo.findOneBy({ ruleCode: dto.ruleCode });
    if (exists) {
      throw new BadRequestException(`策略编码 ${dto.ruleCode} 已存在`);
    }

    // 如果设为默认激活策略，先将其他策略取消默认
    if (dto.isDefault === 1) {
      await this.ruleRepo.update({}, { isDefault: 0 });
    }

    const rule = this.ruleRepo.create({
      ...dto,
      createdBy: userId,
      updatedBy: userId,
    });

    return await this.ruleRepo.save(rule);
  }

  // 6. 更新策略规则
  async update(id: number, dto: UpdateRecommendRuleDto, userId: number): Promise<RecommendRuleEntity> {
    const rule = await this.ruleRepo.findOneBy({ id });
    if (!rule) {
      throw new NotFoundException(`策略规则 ID ${id} 不存在`);
    }

    if (dto.ruleCode && dto.ruleCode !== rule.ruleCode) {
      const exists = await this.ruleRepo.findOneBy({ ruleCode: dto.ruleCode });
      if (exists && exists.id !== id) {
        throw new BadRequestException(`策略编码 ${dto.ruleCode} 已被其他规则占用`);
      }
    }

    if (dto.isDefault === 1) {
      await this.ruleRepo.update({}, { isDefault: 0 });
    }

    Object.assign(rule, {
      ...dto,
      updatedBy: userId,
    });

    return await this.ruleRepo.save(rule);
  }

  // 7. 设为默认激活策略
  async setActive(id: number, userId: number): Promise<RecommendRuleEntity> {
    const rule = await this.ruleRepo.findOneBy({ id });
    if (!rule) {
      throw new NotFoundException(`策略规则 ID ${id} 不存在`);
    }

    await this.ruleRepo.update({}, { isDefault: 0 });
    rule.isDefault = 1;
    rule.status = 1; // 激活时自动启用
    rule.updatedBy = userId;
    return await this.ruleRepo.save(rule);
  }

  // 8. 删除策略规则
  async remove(id: number, userId: number): Promise<void> {
    const rule = await this.ruleRepo.findOneBy({ id });
    if (!rule) {
      throw new NotFoundException(`策略规则 ID ${id} 不存在`);
    }
    if (rule.isDefault === 1) {
      throw new BadRequestException('不能删除当前全局默认激活策略，请先切换其他策略为默认');
    }
    await this.ruleRepo.softDelete(id);
  }

  // 9. 推荐计分核心算法引擎
  calculateArticleScore(
    article: ArticleEntity,
    weights: RecommendWeightsConfig,
    coldStart?: ColdStartConfig,
    context?: { categoryId?: number; tags?: string[] },
  ): ScoreBreakdown | null {
    const now = new Date().getTime();

    // 检查人工干预：算法屏蔽/禁推
    if (article.recommendFactor === 2) {
      return null;
    }

    // 检查推荐干预有效截止时间
    let isRecommendOverrideActive = true;
    if (article.recommendExpireAt && new Date(article.recommendExpireAt).getTime() < now) {
      isRecommendOverrideActive = false;
    }

    // 1. 基础互动得分 (对数平滑阅读量 + 线性点赞/评论加权)
    const viewComponent = (weights.viewWeight || 0) * Math.log(1 + Math.max(0, Number(article.viewCount || 0)));
    const likeComponent = (weights.likeWeight || 0) * Math.max(0, Number(article.likeCount || 0)) * 0.5;
    const commentComponent = (weights.commentWeight || 0) * 2.0; // 模拟评论基础系数
    const interactionScore = Math.max(1, viewComponent + likeComponent + commentComponent);

    // 2. 时间衰减因子 (Hacker News Gravity 模型)
    const publishTime = article.publishedAt
      ? new Date(article.publishedAt).getTime()
      : new Date(article.createdAt).getTime();
    const hoursSincePublish = Math.max(0.1, (now - publishTime) / (1000 * 3600));
    const gravity = Math.max(0.1, weights.timeDecayRate || 1.5);
    // 衰减公式: 1 / (1 + hours / 24)^G
    const timeDecayFactor = 1 / Math.pow(1 + hoursSincePublish / 24, gravity);

    // 3. 冷启动保量扶持
    let coldStartMultiplier = 1.0;
    let isColdStartApplied = false;
    const daysSincePublish = hoursSincePublish / 24;

    if (article.recommendFactor === 3) {
      // 强制冷启动扶持模式
      coldStartMultiplier = coldStart?.boostScoreMultiplier || 2.0;
      isColdStartApplied = true;
    } else if (
      coldStart?.enableColdStart &&
      daysSincePublish <= (coldStart.boostDays || 7) &&
      Number(article.viewCount || 0) < (coldStart.minImpressionsThreshold || 300)
    ) {
      const maxBoost = Math.max(1.0, coldStart.boostScoreMultiplier || 1.6);
      const remainingRatio = 1 - daysSincePublish / (coldStart.boostDays || 7);
      coldStartMultiplier = 1.0 + (maxBoost - 1.0) * Math.max(0, remainingRatio);
      isColdStartApplied = true;
    }

    // 4. 人工运营加权与单篇干预
    let manualBoostScore = 0;
    if (article.isRecommend === 1) {
      manualBoostScore += (weights.manualBoostWeight || 50) * 3;
    }
    if (isRecommendOverrideActive && article.recommendWeight) {
      // recommendWeight: -100 ~ +100
      manualBoostScore += article.recommendWeight * 10;
    }
    if (article.isTop === 1) {
      manualBoostScore += 500; // 置顶强提权
    }

    // 5. 上下文相关度 (分类与标签匹配)
    let relevanceScore = 0;
    if (context?.categoryId && Number(article.categoryId) === Number(context.categoryId)) {
      relevanceScore += (weights.categoryMatchWeight || 30) * 2;
    }
    if (context?.tags && context.tags.length > 0 && article.tags) {
      const articleTagList = article.tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      const matchCount = context.tags.filter((t) => articleTagList.includes(t.toLowerCase())).length;
      if (matchCount > 0) {
        relevanceScore += matchCount * (weights.tagMatchWeight || 35) * 1.5;
      }
    }

    // 6. 综合最终推荐得分
    const rawScore = interactionScore * timeDecayFactor * coldStartMultiplier + manualBoostScore + relevanceScore;
    const finalScore = Math.round(Math.max(0, rawScore) * 100) / 100;

    return {
      interactionScore: Math.round(interactionScore * 100) / 100,
      viewComponent: Math.round(viewComponent * 100) / 100,
      likeComponent: Math.round(likeComponent * 100) / 100,
      commentComponent: Math.round(commentComponent * 100) / 100,
      timeDecayFactor: Math.round(timeDecayFactor * 1000) / 1000,
      hoursSincePublish: Math.round(hoursSincePublish * 10) / 10,
      coldStartMultiplier: Math.round(coldStartMultiplier * 100) / 100,
      isColdStartApplied,
      manualBoostScore: Math.round(manualBoostScore * 100) / 100,
      relevanceScore: Math.round(relevanceScore * 100) / 100,
      finalScore,
    };
  }

  // 10. 实时沙盘试算与得分拆解接口 (Simulate & Sandbox)
  async simulate(dto: SimulateRecommendDto) {
    const {
      weights,
      coldStartConfig = {
        enableColdStart: true,
        boostDays: 7,
        boostScoreMultiplier: 1.6,
        minImpressionsThreshold: 200,
      },
      limit = 20,
      contextCategoryId,
      contextTags,
    } = dto;

    const parsedContextTags = contextTags
      ? contextTags.split(',').map((t) => t.trim()).filter(Boolean)
      : undefined;

    // 拉取已发布的候选文章 (status = 2)
    const articles = await this.articleRepo.find({
      where: { status: 2 },
      relations: { category: true, author: true },
      order: { id: 'DESC' },
      take: 100,
    });

    // 计算基准自然热度排序 (基准权重对照)
    const baseWeights: RecommendWeightsConfig = {
      viewWeight: 20,
      likeWeight: 40,
      commentWeight: 30,
      timeDecayRate: 1.5,
      tagMatchWeight: 30,
      categoryMatchWeight: 30,
      manualBoostWeight: 50,
    };

    const baseRanked = articles
      .map((a) => ({
        id: a.id,
        score: this.calculateArticleScore(a, baseWeights, coldStartConfig, {
          categoryId: contextCategoryId,
          tags: parsedContextTags,
        })?.finalScore || 0,
      }))
      .sort((a, b) => b.score - a.score);

    const baseRankMap = new Map<number, number>();
    baseRanked.forEach((item, index) => baseRankMap.set(item.id, index + 1));

    // 计算当前参数下的试算得分
    const scoredList: RecommendedArticleItem[] = [];

    for (const article of articles) {
      const breakdown = this.calculateArticleScore(article, weights, coldStartConfig, {
        categoryId: contextCategoryId,
        tags: parsedContextTags,
      });

      if (!breakdown) {
        continue; // 被禁推或屏蔽
      }

      scoredList.push({
        id: article.id,
        title: article.title,
        summary: article.summary,
        coverImage: article.coverImage,
        categoryId: article.categoryId,
        categoryName: article.category?.name || '未分类',
        authorId: article.authorId,
        authorName: article.author?.nickname || article.author?.username || '未知作者',
        tags: article.tags || '',
        viewCount: Number(article.viewCount || 0),
        likeCount: Number(article.likeCount || 0),
        publishedAt: article.publishedAt,
        isTop: article.isTop,
        isRecommend: article.isRecommend,
        recommendWeight: article.recommendWeight || 0,
        recommendFactor: article.recommendFactor || 0,
        recommendExpireAt: article.recommendExpireAt,
        scoreBreakdown: breakdown,
      });
    }

    // 按最终总得分降序排列
    scoredList.sort((a, b) => b.scoreBreakdown.finalScore - a.scoreBreakdown.finalScore);

    // 计算排名升降变动 delta
    const resultList = scoredList.slice(0, limit).map((item, index) => {
      const currentRank = index + 1;
      const originalRank = baseRankMap.get(item.id) || currentRank;
      const rankDelta = originalRank - currentRank; // 正数表示排名上升，负数表示下降
      return {
        ...item,
        simulatedRank: currentRank,
        rankDelta,
      };
    });

    return {
      totalCandidates: articles.length,
      recommendedCount: resultList.length,
      simulatedList: resultList,
      weightsSnapshot: weights,
      coldStartSnapshot: coldStartConfig,
    };
  }

  // 11. 推荐文章流服务 (对外与前台推荐接口，支持多样性打散与去重)
  async getRecommendedArticles(query: {
    limit?: number;
    categoryId?: number;
    tags?: string;
    excludeIds?: number[];
  }) {
    const { limit = 10, categoryId, tags, excludeIds = [] } = query;
    const activeConfig = await this.getActiveConfig();

    const parsedTags = tags
      ? tags.split(',').map((t) => t.trim()).filter(Boolean)
      : undefined;

    const qb = this.articleRepo
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.author', 'author')
      .where('article.status = :status', { status: 2 });

    if (excludeIds.length > 0) {
      qb.andWhere('article.id NOT IN (:...excludeIds)', { excludeIds });
    }

    const articles = await qb.getMany();

    const candidateList: { article: ArticleEntity; breakdown: ScoreBreakdown }[] = [];

    for (const article of articles) {
      const breakdown = this.calculateArticleScore(
        article,
        activeConfig.weights,
        activeConfig.coldStartConfig,
        { categoryId, tags: parsedTags },
      );
      if (breakdown) {
        candidateList.push({ article, breakdown });
      }
    }

    // 初始排序
    candidateList.sort((a, b) => b.breakdown.finalScore - a.breakdown.finalScore);

    // 多样性与打散控制 (同一分类最多连续 maxPerCategory 篇)
    const maxPerCat = activeConfig.diversityConfig?.maxPerCategory || 3;
    const finalFeed: any[] = [];
    const categoryCountMap = new Map<number, number>();

    for (const item of candidateList) {
      if (finalFeed.length >= limit) break;
      const catId = item.article.categoryId || 0;
      const currentCatCount = categoryCountMap.get(catId) || 0;

      if (currentCatCount < maxPerCat) {
        categoryCountMap.set(catId, currentCatCount + 1);
        finalFeed.push({
          id: item.article.id,
          title: item.article.title,
          summary: item.article.summary,
          coverImage: item.article.coverImage,
          categoryId: item.article.categoryId,
          categoryName: item.article.category?.name || '未分类',
          authorName: item.article.author?.nickname || item.article.author?.username || '未知作者',
          tags: item.article.tags,
          viewCount: item.article.viewCount,
          likeCount: item.article.likeCount,
          publishedAt: item.article.publishedAt,
          isTop: item.article.isTop,
          isRecommend: item.article.isRecommend,
          recommendScore: item.breakdown.finalScore,
        });
      }
    }

    return finalFeed;
  }

  // 12. 快速设置单篇文章推荐干预属性
  async updateArticleControl(
    articleId: number,
    dto: UpdateArticleRecommendControlDto,
    userId: number,
  ): Promise<ArticleEntity> {
    const article = await this.articleRepo.findOneBy({ id: articleId });
    if (!article) {
      throw new NotFoundException(`文章 ID ${articleId} 不存在`);
    }

    if (dto.isRecommend !== undefined) {
      article.isRecommend = dto.isRecommend;
    }
    if (dto.recommendWeight !== undefined) {
      article.recommendWeight = dto.recommendWeight;
    }
    if (dto.recommendFactor !== undefined) {
      article.recommendFactor = dto.recommendFactor;
    }
    if (dto.recommendExpireAt !== undefined) {
      article.recommendExpireAt = dto.recommendExpireAt as any;
    }

    article.updatedBy = userId;
    return await this.articleRepo.save(article);
  }
}
