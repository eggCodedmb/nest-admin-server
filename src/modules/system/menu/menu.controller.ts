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
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { RequireAbility } from '../../../common/decorators/check-policies.decorator';
import { Action } from '../../casl/casl.types';
import { MenuEntity } from './entities/menu.entity';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Log } from '../../../common/decorators/log.decorator';
import { BusinessType } from '../../../common/constants/system.constants';

@ApiTags('系统菜单管理')
@ApiBearerAuth('bearer-token')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('system/menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @ApiOperation({ summary: '获取当前用户动态路由树' })
  @Get('routers')
  async getRouters(@CurrentUser() user: any) {
    const isAdmin = user.roles?.some((r: any) => r.roleKey === 'admin') || user.userId === 1;
    return await this.menuService.getRoutersByUserId(user.userId, isAdmin);
  }

  @ApiOperation({ summary: '获取全部菜单树形结构' })
  @RequireAbility(Action.Read, MenuEntity)
  @Get('tree')
  async tree(@Query('menuName') menuName?: string, @Query('status') status?: number) {
    return await this.menuService.getTree({ menuName, status });
  }

  @ApiOperation({ summary: '获取菜单列表 (扁平)' })
  @RequireAbility(Action.Read, MenuEntity)
  @Get('list')
  async list(@Query('menuName') menuName?: string, @Query('status') status?: number) {
    return await this.menuService.findAll({ menuName, status });
  }

  @ApiOperation({ summary: '获取菜单详情' })
  @RequireAbility(Action.Read, MenuEntity)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.menuService.findOne(id);
  }

  @ApiOperation({ summary: '新增菜单' })
  @RequireAbility(Action.Create, MenuEntity)
  @Log({ title: '新增菜单', businessType: BusinessType.INSERT })
  @Post()
  async create(@Body() dto: CreateMenuDto) {
    return await this.menuService.create(dto);
  }

  @ApiOperation({ summary: '修改菜单' })
  @RequireAbility(Action.Update, MenuEntity)
  @Log({ title: '修改菜单', businessType: BusinessType.UPDATE })
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMenuDto) {
    return await this.menuService.update(id, dto);
  }

  @ApiOperation({ summary: '删除菜单' })
  @RequireAbility(Action.Delete, MenuEntity)
  @Log({ title: '删除菜单', businessType: BusinessType.DELETE })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.menuService.remove(id);
    return { message: '删除成功' };
  }
}
