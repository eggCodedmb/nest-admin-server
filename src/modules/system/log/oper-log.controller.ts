import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OperLogService } from './oper-log.service';
import { QueryOperLogDto } from './dto/query-oper-log.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { RequireAbility } from '../../../common/decorators/check-policies.decorator';
import { Action } from '../../casl/casl.types';
import { OperLogEntity } from './entities/oper-log.entity';

@ApiTags('系统操作日志')
@ApiBearerAuth('bearer-token')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('system/log')
export class OperLogController {
  constructor(private readonly operLogService: OperLogService) {}

  @ApiOperation({ summary: '分页查询操作日志' })
  @RequireAbility(Action.Read, OperLogEntity)
  @Get('list')
  async list(@Query() query: QueryOperLogDto) {
    return await this.operLogService.page(query);
  }

  @ApiOperation({ summary: '查询操作日志详情' })
  @RequireAbility(Action.Read, OperLogEntity)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.operLogService.findOne(id);
  }

  @ApiOperation({ summary: '清空全部操作日志' })
  @RequireAbility(Action.Delete, OperLogEntity)
  @Delete('clean')
  async clean() {
    return await this.operLogService.clean();
  }

  @ApiOperation({ summary: '删除操作日志 (逗号分隔ID)' })
  @RequireAbility(Action.Delete, OperLogEntity)
  @Delete(':ids')
  async remove(@Param('ids') ids: string) {
    const idArray = ids.split(',').map((id) => parseInt(id, 10)).filter(Boolean);
    return await this.operLogService.remove(idArray);
  }
}
