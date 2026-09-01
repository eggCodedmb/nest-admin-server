import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecommendService } from './recommend.service';
import { CreateRecommendRuleDto } from './dto/create-recommend-rule.dto';
import { UpdateRecommendRuleDto } from './dto/update-recommend-rule.dto';
import { QueryRecommendRuleDto } from './dto/query-recommend-rule.dto';
import { SimulateRecommendDto } from './dto/simulate-recommend.dto';
import { UpdateArticleRecommendControlDto } from './dto/update-article-recommend-control.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { RequireAbility } from '../../../common/decorators/check-policies.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Action } from '../../casl/casl.types';
import { RecommendRuleEntity } from './entities/recommend-rule.entity';
import { ArticleEntity } from '../post/entities/article.entity';
import { Log } from '../../../common/decorators/log.decorator';
import { BusinessType } from '../../../common/constants/system.constants';

@ApiTags('文章推荐算法控制')
@ApiBearerAuth('bearer-token')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('article/recommend')
export class RecommendController {
  constructor(private readonly recommendService: RecommendService) {}

  @ApiOperation({ summary: '分页查询推荐策略列表' })
  @RequireAbility(Action.Read, RecommendRuleEntity)
  @Get('config/list')
  async list(@Query() query: QueryRecommendRuleDto) {
    return await this.recommendService.page(query);
  }

  @ApiOperation({ summary: '获取全部启用的策略列表' })
  @RequireAbility(Action.Read, RecommendRuleEntity)
  @Get('config/all')
  async findAll() {
    return await this.recommendService.findAll();
  }

  @ApiOperation({ summary: '获取当前全局默认激活策略' })
  @RequireAbility(Action.Read, RecommendRuleEntity)
  @Get('config/active')
  async getActive() {
    return await this.recommendService.getActiveConfig();
  }

  @ApiOperation({ summary: '获取推荐策略详情' })
  @RequireAbility(Action.Read, RecommendRuleEntity)
  @Get('config/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.recommendService.findOne(id);
  }

  @ApiOperation({ summary: '新增推荐算法策略' })
  @RequireAbility(Action.Create, RecommendRuleEntity)
  @Log({ title: '新增推荐算法策略', businessType: BusinessType.INSERT })
  @Post('config')
  async create(
    @Body() dto: CreateRecommendRuleDto,
    @CurrentUser('userId') userId: number,
  ) {
    return await this.recommendService.create(dto, userId);
  }

  @ApiOperation({ summary: '修改推荐算法策略' })
  @RequireAbility(Action.Update, RecommendRuleEntity)
  @Log({ title: '修改推荐算法策略', businessType: BusinessType.UPDATE })
  @Put('config/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRecommendRuleDto,
    @CurrentUser('userId') userId: number,
  ) {
    return await this.recommendService.update(id, dto, userId);
  }

  @ApiOperation({ summary: '设为全局默认激活策略' })
  @RequireAbility(Action.Update, RecommendRuleEntity)
  @Log({ title: '激活推荐算法策略', businessType: BusinessType.UPDATE })
  @Put('config/:id/active')
  async setActive(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ) {
    return await this.recommendService.setActive(id, userId);
  }

  @ApiOperation({ summary: '删除推荐策略规则' })
  @RequireAbility(Action.Delete, RecommendRuleEntity)
  @Log({ title: '删除推荐算法策略', businessType: BusinessType.DELETE })
  @Delete('config/:id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ) {
    await this.recommendService.remove(id, userId);
    return { message: '策略删除成功' };
  }

  @ApiOperation({ summary: '算法实时沙盘试算与排名预测 (Live Simulator)' })
  @RequireAbility(Action.Read, RecommendRuleEntity)
  @Post('simulate')
  async simulate(@Body() dto: SimulateRecommendDto) {
    return await this.recommendService.simulate(dto);
  }

  @ApiOperation({ summary: '获取算法推荐文章流 (Feed API)' })
  @RequireAbility(Action.Read, ArticleEntity)
  @Get('feed')
  async getFeed(
    @Query('limit') limit?: number,
    @Query('categoryId') categoryId?: number,
    @Query('tags') tags?: string,
  ) {
    return await this.recommendService.getRecommendedArticles({
      limit: limit ? Number(limit) : 10,
      categoryId: categoryId ? Number(categoryId) : undefined,
      tags,
    });
  }

  @ApiOperation({ summary: '单篇文章推荐干预设置' })
  @RequireAbility(Action.Update, ArticleEntity)
  @Log({ title: '修改文章推荐干预', businessType: BusinessType.UPDATE })
  @Put('article/:id/control')
  async updateArticleControl(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateArticleRecommendControlDto,
    @CurrentUser('userId') userId: number,
  ) {
    return await this.recommendService.updateArticleControl(id, dto, userId);
  }
}
