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
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { UpdateDataScopeDto } from './dto/update-data-scope.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { RequireAbility } from '../../../common/decorators/check-policies.decorator';
import { Action } from '../../casl/casl.types';
import { RoleEntity } from './entities/role.entity';
import { Log } from '../../../common/decorators/log.decorator';
import { BusinessType } from '../../../common/constants/system.constants';

@ApiTags('系统角色管理')
@ApiBearerAuth('bearer-token')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('system/role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @ApiOperation({ summary: '分页获取角色列表' })
  @RequireAbility(Action.Read, RoleEntity)
  @Get('list')
  async list(@Query() query: QueryRoleDto) {
    return await this.roleService.page(query);
  }

  @ApiOperation({ summary: '获取全部正常角色列表 (下拉选项)' })
  @RequireAbility(Action.Read, RoleEntity)
  @Get('all')
  async all() {
    return await this.roleService.findAll();
  }

  @ApiOperation({ summary: '获取角色详情' })
  @RequireAbility(Action.Read, RoleEntity)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.roleService.findOne(id);
  }

  @ApiOperation({ summary: '新增角色' })
  @RequireAbility(Action.Create, RoleEntity)
  @Log({ title: '新增角色', businessType: BusinessType.INSERT })
  @Post()
  async create(@Body() dto: CreateRoleDto) {
    return await this.roleService.create(dto);
  }

  @ApiOperation({ summary: '修改角色' })
  @RequireAbility(Action.Update, RoleEntity)
  @Log({ title: '修改角色', businessType: BusinessType.UPDATE })
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return await this.roleService.update(id, dto);
  }

  @ApiOperation({ summary: '修改角色数据权限范围' })
  @RequireAbility(Action.Update, RoleEntity)
  @Log({ title: '修改角色数据权限', businessType: BusinessType.UPDATE })
  @Put(':id/data-scope')
  async updateDataScope(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDataScopeDto,
  ) {
    return await this.roleService.updateDataScope(id, dto);
  }

  @ApiOperation({ summary: '修改角色状态' })
  @RequireAbility(Action.Update, RoleEntity)
  @Log({ title: '修改角色状态', businessType: BusinessType.UPDATE })
  @Put(':id/status')
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status', ParseIntPipe) status: number,
  ) {
    return await this.roleService.changeStatus(id, status);
  }

  @ApiOperation({ summary: '删除角色' })
  @RequireAbility(Action.Delete, RoleEntity)
  @Log({ title: '删除角色', businessType: BusinessType.DELETE })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.roleService.remove(id);
  }
}
