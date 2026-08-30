import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('首页概览')
@ApiBearerAuth('bearer-token')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOperation({ summary: '获取首页概览实时数据' })
  @Get('overview')
  async overview(@Query('range') range?: string) {
    return this.dashboardService.getOverview(range === '30d' ? 30 : 7);
  }
}
