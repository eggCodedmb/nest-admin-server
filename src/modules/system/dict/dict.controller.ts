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
import { DictService } from './dict.service';
import { CreateDictTypeDto, UpdateDictTypeDto } from './dto/create-dict-type.dto';
import { CreateDictDataDto, UpdateDictDataDto } from './dto/create-dict-data.dto';
import { QueryDictTypeDto, QueryDictDataDto } from './dto/query-dict.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { RequireAbility } from '../../../common/decorators/check-policies.decorator';
import { Action } from '../../casl/casl.types';
import { DictTypeEntity } from './entities/dict-type.entity';
import { DictDataEntity } from './entities/dict-data.entity';
import { Log } from '../../../common/decorators/log.decorator';
import { BusinessType } from '../../../common/constants/system.constants';

@ApiTags('系统数据字典')
@ApiBearerAuth('bearer-token')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('system/dict')
export class DictController {
  constructor(private readonly dictService: DictService) {}

  // ================= 字典类型接口 =================

  @ApiOperation({ summary: '分页查询字典类型' })
  @RequireAbility(Action.Read, DictTypeEntity)
  @Get('type/list')
  async pageType(@Query() query: QueryDictTypeDto) {
    return await this.dictService.pageType(query);
  }

  @ApiOperation({ summary: '获取全部字典类型 (下拉选项)' })
  @RequireAbility(Action.Read, DictTypeEntity)
  @Get('type/all')
  async allTypes() {
    return await this.dictService.findAllTypes();
  }

  @ApiOperation({ summary: '查询字典类型详情' })
  @RequireAbility(Action.Read, DictTypeEntity)
  @Get('type/:id')
  async findOneType(@Param('id', ParseIntPipe) id: number) {
    return await this.dictService.findOneType(id);
  }

  @ApiOperation({ summary: '新增字典类型' })
  @RequireAbility(Action.Create, DictTypeEntity)
  @Log({ title: '新增字典类型', businessType: BusinessType.INSERT })
  @Post('type')
  async createType(@Body() dto: CreateDictTypeDto) {
    return await this.dictService.createType(dto);
  }

  @ApiOperation({ summary: '修改字典类型' })
  @RequireAbility(Action.Update, DictTypeEntity)
  @Log({ title: '修改字典类型', businessType: BusinessType.UPDATE })
  @Put('type/:id')
  async updateType(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDictTypeDto,
  ) {
    return await this.dictService.updateType(id, dto);
  }

  @ApiOperation({ summary: '删除字典类型' })
  @RequireAbility(Action.Delete, DictTypeEntity)
  @Log({ title: '删除字典类型', businessType: BusinessType.DELETE })
  @Delete('type/:id')
  async removeType(@Param('id', ParseIntPipe) id: number) {
    return await this.dictService.removeType(id);
  }

  // ================= 字典数据接口 =================

  @ApiOperation({ summary: '分页查询字典数据' })
  @RequireAbility(Action.Read, DictDataEntity)
  @Get('data/list')
  async pageData(@Query() query: QueryDictDataDto) {
    return await this.dictService.pageData(query);
  }

  @ApiOperation({ summary: '根据字典类型查询字典数据列表' })
  @Get('data/type/:dictType')
  async getDataByType(@Param('dictType') dictType: string) {
    return await this.dictService.getDictDataByType(dictType);
  }

  @ApiOperation({ summary: '查询字典数据详情' })
  @RequireAbility(Action.Read, DictDataEntity)
  @Get('data/:id')
  async findOneData(@Param('id', ParseIntPipe) id: number) {
    return await this.dictService.findOneData(id);
  }

  @ApiOperation({ summary: '新增字典数据' })
  @RequireAbility(Action.Create, DictDataEntity)
  @Log({ title: '新增字典数据', businessType: BusinessType.INSERT })
  @Post('data')
  async createData(@Body() dto: CreateDictDataDto) {
    return await this.dictService.createData(dto);
  }

  @ApiOperation({ summary: '修改字典数据' })
  @RequireAbility(Action.Update, DictDataEntity)
  @Log({ title: '修改字典数据', businessType: BusinessType.UPDATE })
  @Put('data/:id')
  async updateData(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDictDataDto,
  ) {
    return await this.dictService.updateData(id, dto);
  }

  @ApiOperation({ summary: '删除字典数据' })
  @RequireAbility(Action.Delete, DictDataEntity)
  @Log({ title: '删除字典数据', businessType: BusinessType.DELETE })
  @Delete('data/:id')
  async removeData(@Param('id', ParseIntPipe) id: number) {
    return await this.dictService.removeData(id);
  }

  @ApiOperation({ summary: '刷新字典缓存' })
  @RequireAbility(Action.Delete, DictTypeEntity)
  @Delete('cache/clear')
  async clearCache() {
    await this.dictService.clearCache();
    return { message: '缓存清除成功' };
  }
}
