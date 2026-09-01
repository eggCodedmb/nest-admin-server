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
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { RequireAbility } from '../../../common/decorators/check-policies.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Action } from '../../casl/casl.types';
import { ArticleEntity } from './entities/article.entity';
import { Log } from '../../../common/decorators/log.decorator';
import { BusinessType } from '../../../common/constants/system.constants';

@ApiTags('文章内容管理')
@ApiBearerAuth('bearer-token')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('article/post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @ApiOperation({ summary: '分页查询文章列表' })
  @RequireAbility(Action.Read, ArticleEntity)
  @Get('list')
  async list(@Query() query: QueryPostDto, @CurrentUser() user: any) {
    return await this.postService.page(query, user);
  }

  @ApiOperation({ summary: '获取文章详情' })
  @RequireAbility(Action.Read, ArticleEntity)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.postService.findOne(id);
  }

  @ApiOperation({ summary: '新增文章/保存草稿' })
  @RequireAbility(Action.Create, ArticleEntity)
  @Log({ title: '新增文章', businessType: BusinessType.INSERT })
  @Post()
  async create(@Body() dto: CreatePostDto, @CurrentUser('userId') userId: number) {
    return await this.postService.create(dto, userId);
  }

  @ApiOperation({ summary: '修改文章' })
  @RequireAbility(Action.Update, ArticleEntity)
  @Log({ title: '修改文章', businessType: BusinessType.UPDATE })
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
    @CurrentUser('userId') userId: number,
  ) {
    return await this.postService.update(id, dto, userId);
  }

  @ApiOperation({ summary: '提交文章审核' })
  @RequireAbility(Action.Update, ArticleEntity)
  @Log({ title: '提交文章审核', businessType: BusinessType.UPDATE })
  @Post(':id/submit')
  async submitAudit(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ) {
    return await this.postService.submitAudit(id, userId);
  }

  @ApiOperation({ summary: '修改文章状态(置顶/推荐/推荐干预/上下架)' })
  @RequireAbility(Action.Update, ArticleEntity)
  @Log({ title: '修改文章状态', businessType: BusinessType.UPDATE })
  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      status?: number;
      isTop?: number;
      isRecommend?: number;
      recommendWeight?: number;
      recommendFactor?: number;
      recommendExpireAt?: Date;
    },
    @CurrentUser('userId') userId: number,
  ) {
    return await this.postService.updateStatus(id, body, userId);
  }

  @ApiOperation({ summary: '删除文章' })
  @RequireAbility(Action.Delete, ArticleEntity)
  @Log({ title: '删除文章', businessType: BusinessType.DELETE })
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ) {
    await this.postService.remove(id, userId);
    return { message: '文章删除成功' };
  }
}
