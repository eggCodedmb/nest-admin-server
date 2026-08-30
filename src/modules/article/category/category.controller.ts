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
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { RequireAbility } from '../../../common/decorators/check-policies.decorator';
import { Action } from '../../casl/casl.types';
import { CategoryEntity } from './entities/category.entity';
import { Log } from '../../../common/decorators/log.decorator';
import { BusinessType } from '../../../common/constants/system.constants';

@ApiTags('文章分类管理')
@ApiBearerAuth('bearer-token')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('article/category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiOperation({ summary: '获取分类树' })
  @RequireAbility(Action.Read, CategoryEntity)
  @Get('tree')
  async tree(@Query() query: QueryCategoryDto) {
    return await this.categoryService.getTree(query);
  }

  @ApiOperation({ summary: '获取分类列表' })
  @RequireAbility(Action.Read, CategoryEntity)
  @Get('list')
  async list(@Query() query: QueryCategoryDto) {
    return await this.categoryService.findAll(query);
  }

  @ApiOperation({ summary: '获取分类详情' })
  @RequireAbility(Action.Read, CategoryEntity)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.categoryService.findOne(id);
  }

  @ApiOperation({ summary: '新增文章分类' })
  @RequireAbility(Action.Create, CategoryEntity)
  @Log({ title: '新增文章分类', businessType: BusinessType.INSERT })
  @Post()
  async create(@Body() dto: CreateCategoryDto) {
    return await this.categoryService.create(dto);
  }

  @ApiOperation({ summary: '修改文章分类' })
  @RequireAbility(Action.Update, CategoryEntity)
  @Log({ title: '修改文章分类', businessType: BusinessType.UPDATE })
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return await this.categoryService.update(id, dto);
  }

  @ApiOperation({ summary: '删除文章分类' })
  @RequireAbility(Action.Delete, CategoryEntity)
  @Log({ title: '删除文章分类', businessType: BusinessType.DELETE })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.categoryService.remove(id);
    return { message: '分类删除成功' };
  }
}
