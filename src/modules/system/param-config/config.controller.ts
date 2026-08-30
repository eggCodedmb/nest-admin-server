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
import { ParamConfigService } from './config.service';
import { CreateConfigDto, UpdateConfigDto } from './dto/create-config.dto';
import { QueryConfigDto } from './dto/query-config.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { RequireAbility } from '../../../common/decorators/check-policies.decorator';
import { Action } from '../../casl/casl.types';
import { ConfigEntity } from './entities/config.entity';
import { Log } from '../../../common/decorators/log.decorator';
import { BusinessType } from '../../../common/constants/system.constants';

@ApiTags('系统参数配置')
@ApiBearerAuth('bearer-token')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('system/config')
export class ParamConfigController {
  constructor(private readonly configService: ParamConfigService) {}

  @ApiOperation({ summary: '分页查询参数配置' })
  @RequireAbility(Action.Read, ConfigEntity)
  @Get('list')
  async list(@Query() query: QueryConfigDto) {
    return await this.configService.page(query);
  }

  @ApiOperation({ summary: '根据参数键名获取参数值' })
  @Get('key/:configKey')
  async getConfigKey(@Param('configKey') configKey: string) {
    return await this.configService.getConfigSettingByKey(configKey);
  }

  @ApiOperation({ summary: '获取参数详情' })
  @RequireAbility(Action.Read, ConfigEntity)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.configService.findOne(id);
  }

  @ApiOperation({ summary: '新增参数配置' })
  @RequireAbility(Action.Create, ConfigEntity)
  @Log({ title: '新增参数配置', businessType: BusinessType.INSERT })
  @Post()
  async create(@Body() dto: CreateConfigDto) {
    return await this.configService.create(dto);
  }

  @ApiOperation({ summary: '修改参数配置' })
  @RequireAbility(Action.Update, ConfigEntity)
  @Log({ title: '修改参数配置', businessType: BusinessType.UPDATE })
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateConfigDto,
  ) {
    return await this.configService.update(id, dto);
  }

  @ApiOperation({ summary: '删除参数配置' })
  @RequireAbility(Action.Delete, ConfigEntity)
  @Log({ title: '删除参数配置', businessType: BusinessType.DELETE })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.configService.remove(id);
  }

  @ApiOperation({ summary: '刷新参数缓存' })
  @RequireAbility(Action.Delete, ConfigEntity)
  @Delete('cache/clear')
  async clearCache() {
    await this.configService.clearCache();
    return { message: '缓存清除成功' };
  }
}
