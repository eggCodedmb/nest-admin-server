import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Log } from '../../common/decorators/log.decorator';
import { BusinessType } from '../../common/constants/system.constants';
import { getClientIp } from '../../common/utils/ip.util';

@ApiTags('认证安全中心')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '获取图形验证码' })
  @Public()
  @Get('captcha')
  async captcha() {
    return await this.authService.createCaptcha();
  }

  @ApiOperation({ summary: '账号密码登录' })
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Log({ title: '用户登录', businessType: BusinessType.OTHER })
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const clientIp = getClientIp(req);
    return await this.authService.login(dto, clientIp);
  }

  @ApiOperation({ summary: '刷新 Access Token' })
  @Public()
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return await this.authService.refreshToken(dto);
  }

  @ApiOperation({ summary: '退出登录' })
  @ApiBearerAuth('bearer-token')
  @UseGuards(JwtAuthGuard)
  @Log({ title: '退出登录', businessType: BusinessType.OTHER })
  @Post('logout')
  async logout(@CurrentUser('userId') userId: number) {
    return await this.authService.logout(userId);
  }

  @ApiOperation({ summary: '获取当前登录人信息与权限' })
  @ApiBearerAuth('bearer-token')
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser('userId') userId: number) {
    return await this.authService.getProfile(userId);
  }
}
