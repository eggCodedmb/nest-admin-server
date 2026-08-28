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
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { RequireAbility } from '../../../common/decorators/check-policies.decorator';
import { Action } from '../../casl/casl.types';
import { UserEntity } from './entities/user.entity';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Log } from '../../../common/decorators/log.decorator';
import { BusinessType } from '../../../common/constants/system.constants';

@ApiTags('系统用户管理')
@ApiBearerAuth('bearer-token')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('system/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: '分页获取用户列表' })
  @RequireAbility(Action.Read, UserEntity)
  @Get('list')
  async list(@Query() query: QueryUserDto, @CurrentUser() currentUser: any) {
    return await this.userService.page(query, currentUser);
  }

  @ApiOperation({ summary: '获取用户详情' })
  @RequireAbility(Action.Read, UserEntity)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.findOne(id);
  }

  @ApiOperation({ summary: '新增用户' })
  @RequireAbility(Action.Create, UserEntity)
  @Log({ title: '新增用户', businessType: BusinessType.INSERT })
  @Post()
  async create(@Body() dto: CreateUserDto) {
    return await this.userService.create(dto);
  }

  @ApiOperation({ summary: '修改用户' })
  @RequireAbility(Action.Update, UserEntity)
  @Log({ title: '修改用户', businessType: BusinessType.UPDATE })
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return await this.userService.update(id, dto);
  }

  @ApiOperation({ summary: '重置用户密码' })
  @RequireAbility(Action.Update, UserEntity)
  @Log({ title: '重置用户密码', businessType: BusinessType.UPDATE })
  @Put(':id/reset-password')
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordDto,
  ) {
    return await this.userService.resetPassword(id, dto);
  }

  @ApiOperation({ summary: '修改用户状态' })
  @RequireAbility(Action.Update, UserEntity)
  @Log({ title: '修改用户状态', businessType: BusinessType.UPDATE })
  @Put(':id/status')
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status', ParseIntPipe) status: number,
  ) {
    return await this.userService.changeStatus(id, status);
  }

  @ApiOperation({ summary: '删除用户' })
  @RequireAbility(Action.Delete, UserEntity)
  @Log({ title: '删除用户', businessType: BusinessType.DELETE })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.remove(id);
  }
}
