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
import { DeptService } from './dept.service';
import { CreateDeptDto } from './dto/create-dept.dto';
import { UpdateDeptDto } from './dto/update-dept.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { RequireAbility } from '../../../common/decorators/check-policies.decorator';
import { Action } from '../../casl/casl.types';
import { DeptEntity } from './entities/dept.entity';
import { Log } from '../../../common/decorators/log.decorator';
import { BusinessType } from '../../../common/constants/system.constants';

@ApiTags('系统部门管理')
@ApiBearerAuth('bearer-token')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('system/dept')
export class DeptController {
  constructor(private readonly deptService: DeptService) {}

  @ApiOperation({ summary: '获取部门树形列表' })
  @RequireAbility(Action.Read, DeptEntity)
  @Get('tree')
  async tree(@Query('deptName') deptName?: string, @Query('status') status?: number) {
    return await this.deptService.getTree({ deptName, status });
  }

  @ApiOperation({ summary: '获取部门列表 (扁平)' })
  @RequireAbility(Action.Read, DeptEntity)
  @Get('list')
  async list(@Query('deptName') deptName?: string, @Query('status') status?: number) {
    return await this.deptService.findAll({ deptName, status });
  }

  @ApiOperation({ summary: '获取部门详情' })
  @RequireAbility(Action.Read, DeptEntity)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.deptService.findOne(id);
  }

  @ApiOperation({ summary: '新增部门' })
  @RequireAbility(Action.Create, DeptEntity)
  @Log({ title: '新增部门', businessType: BusinessType.INSERT })
  @Post()
  async create(@Body() dto: CreateDeptDto) {
    return await this.deptService.create(dto);
  }

  @ApiOperation({ summary: '修改部门' })
  @RequireAbility(Action.Update, DeptEntity)
  @Log({ title: '修改部门', businessType: BusinessType.UPDATE })
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDeptDto) {
    return await this.deptService.update(id, dto);
  }

  @ApiOperation({ summary: '删除部门' })
  @RequireAbility(Action.Delete, DeptEntity)
  @Log({ title: '删除部门', businessType: BusinessType.DELETE })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.deptService.remove(id);
    return { message: '删除成功' };
  }
}
