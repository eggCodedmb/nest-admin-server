import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditActionDto } from './dto/audit-action.dto';
import { QueryAuditDto } from './dto/query-audit.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { RequireAbility } from '../../../common/decorators/check-policies.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Action } from '../../casl/casl.types';
import { AuditLogEntity } from './entities/audit-log.entity';
import { Log } from '../../../common/decorators/log.decorator';
import { BusinessType } from '../../../common/constants/system.constants';

@ApiTags('文章审核管理')
@ApiBearerAuth('bearer-token')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('article/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @ApiOperation({ summary: '分页查询待审核文章' })
  @RequireAbility(Action.Read, AuditLogEntity)
  @Get('list')
  async list(@Query() query: QueryAuditDto) {
    return await this.auditService.page(query);
  }

  @ApiOperation({ summary: '执行文章审核动作 (通过/驳回)' })
  @RequireAbility(Action.Update, AuditLogEntity)
  @Log({ title: '执行文章审核', businessType: BusinessType.UPDATE })
  @Post('action')
  async executeAudit(
    @Body() dto: AuditActionDto,
    @CurrentUser('userId') auditorId: number,
  ) {
    return await this.auditService.executeAudit(dto, auditorId);
  }

  @ApiOperation({ summary: '获取指定文章的审核历史轨迹' })
  @RequireAbility(Action.Read, AuditLogEntity)
  @Get('logs/:articleId')
  async getAuditLogs(@Param('articleId', ParseIntPipe) articleId: number) {
    return await this.auditService.getAuditLogs(articleId);
  }
}
