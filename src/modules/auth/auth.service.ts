import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as svgCaptcha from 'svg-captcha';
import { randomUUID } from 'crypto';
import { UserService } from '../system/user/user.service';
import { MenuService } from '../system/menu/menu.service';
import { ParamConfigService } from '../system/param-config/config.service';
import { RedisService } from '../../database/redis.service';
import { REDIS_KEYS } from '../../common/constants/redis.constants';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly menuService: MenuService,
    private readonly paramConfigService: ParamConfigService,
    private readonly redisService: RedisService,
  ) {}

  // 1. 生成图形验证码
  async createCaptcha() {
    const captcha = svgCaptcha.create({
      size: 4,
      fontSize: 50,
      width: 100,
      height: 40,
      background: '#f4f5f7',
      noise: 2,
      color: true,
    });

    const uuid = randomUUID();
    const cacheKey = `${REDIS_KEYS.CAPTCHA_CODE_KEY}${uuid}`;
    // 缓存 2 分钟
    await this.redisService.set(cacheKey, captcha.text.toLowerCase(), 120);

    return {
      uuid,
      img: captcha.data,
    };
  }

  async getCaptchaStatus() {
    const setting = await this.paramConfigService.getConfigSettingByKey(
      'sys.account.captchaEnabled',
    );
    const enabled =
      setting.status === 1 && setting.configValue.toLowerCase() !== 'false';
    return { enabled };
  }

  // 2. 账号密码登录 (含防爆破与双 Token 颁发)
  async login(dto: LoginDto, ip: string) {
    const { username, password, code, uuid } = dto;

    // 检查验证码开关
    const captchaEnabled = await this.getCaptchaStatus();
    if (captchaEnabled.enabled) {
      if (!code || !uuid) {
        throw new BadRequestException('请输入验证码');
      }
      const cacheKey = `${REDIS_KEYS.CAPTCHA_CODE_KEY}${uuid}`;
      const cachedCode = await this.redisService.get(cacheKey);
      if (!cachedCode) {
        throw new BadRequestException('验证码已过期，请刷新后重试');
      }
      if (cachedCode !== code.toLowerCase()) {
        throw new BadRequestException('验证码不正确');
      }
      await this.redisService.del(cacheKey);
    }

    // 检查密码重试次数 (防爆破)
    const failKey = `${REDIS_KEYS.LOGIN_FAIL_KEY}${username}`;
    const failCount = parseInt(
      (await this.redisService.get(failKey)) || '0',
      10,
    );
    if (failCount >= 5) {
      throw new BadRequestException('密码错误连续超过 5 次，请 10 分钟后再试');
    }

    // 查找用户
    const user = await this.userService.findByUsername(username, true);
    if (!user) {
      await this.recordLoginFail(failKey, failCount);
      throw new BadRequestException('用户账号或密码错误');
    }

    if (user.status === 0) {
      throw new BadRequestException('该账号已被停用，请联系管理员');
    }

    // 校验密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.recordLoginFail(failKey, failCount);
      throw new BadRequestException('用户账号或密码错误');
    }

    // 登录成功，清除重试计数
    await this.redisService.del(failKey);

    // 记录最后登录信息
    await this.userService.updateLoginInfo(user.id, ip);

    // 收集角色与权限
    const roles = (user.roles || []).map((r) => ({
      id: Number(r.id),
      roleName: r.roleName,
      roleKey: r.roleKey,
      dataScope: r.dataScope,
    }));
    const isAdmin = roles.some((r) => r.roleKey === 'admin') || user.id === 1;
    const permissions = await this.menuService.getPermissionsByUserId(
      user.id,
      isAdmin,
    );

    // 构造 Payload
    const payload = {
      userId: Number(user.id),
      username: user.username,
      deptId: user.deptId ? Number(user.deptId) : null,
      deptName: user.dept?.deptName || '',
      roles,
      permissions,
    };

    // 颁发 Access Token 与 Refresh Token
    const jwtConfig = this.configService.get('jwt');
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: jwtConfig.expiresIn || '15m',
    });

    const refreshToken = this.jwtService.sign(
      { userId: Number(user.id), type: 'refresh' },
      { expiresIn: jwtConfig.refreshExpiresIn || '7d' },
    );

    // 7天有效期存入 Redis
    const refreshKey = `${REDIS_KEYS.REFRESH_TOKEN_KEY}${user.id}`;
    await this.redisService.set(refreshKey, refreshToken, 7 * 24 * 3600);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 15 * 60, // 15分钟(秒)
    };
  }

  // 3. 双 Token 换发
  async refreshToken(dto: RefreshTokenDto) {
    try {
      const decoded = this.jwtService.verify(dto.refreshToken);
      if (!decoded || decoded.type !== 'refresh' || !decoded.userId) {
        throw new UnauthorizedException('无效的刷新令牌');
      }

      const refreshKey = `${REDIS_KEYS.REFRESH_TOKEN_KEY}${decoded.userId}`;
      const savedToken = await this.redisService.get(refreshKey);
      if (!savedToken || savedToken !== dto.refreshToken) {
        throw new UnauthorizedException('刷新令牌已失效或已在其他终端登录');
      }

      const user = await this.userService.findOne(decoded.userId);
      if (!user || user.status === 0) {
        throw new UnauthorizedException('用户不存在或已被停用');
      }

      const roles = (user.roles || []).map((r: any) => ({
        id: Number(r.id),
        roleName: r.roleName,
        roleKey: r.roleKey,
        dataScope: r.dataScope,
      }));
      const isAdmin = roles.some((r) => r.roleKey === 'admin') || user.id === 1;
      const permissions = await this.menuService.getPermissionsByUserId(
        user.id,
        isAdmin,
      );

      const payload = {
        userId: Number(user.id),
        username: user.username,
        deptId: user.deptId ? Number(user.deptId) : null,
        deptName: user.dept?.deptName || '',
        roles,
        permissions,
      };

      const jwtConfig = this.configService.get('jwt');
      const accessToken = this.jwtService.sign(payload, {
        expiresIn: jwtConfig.expiresIn || '15m',
      });

      const newRefreshToken = this.jwtService.sign(
        { userId: Number(user.id), type: 'refresh' },
        { expiresIn: jwtConfig.refreshExpiresIn || '7d' },
      );

      await this.redisService.set(refreshKey, newRefreshToken, 7 * 24 * 3600);

      return {
        accessToken,
        refreshToken: newRefreshToken,
        tokenType: 'Bearer',
        expiresIn: 15 * 60,
      };
    } catch {
      throw new UnauthorizedException('刷新令牌无效或已过期，请重新登录');
    }
  }

  // 4. 退出登录
  async logout(userId: number) {
    if (userId) {
      await this.redisService.del(`${REDIS_KEYS.REFRESH_TOKEN_KEY}${userId}`);
    }
    return { message: '退出成功' };
  }

  // 5. 获取当前登录人详细信息与权限
  async getProfile(userId: number) {
    const user = await this.userService.findOne(userId);
    const isAdmin =
      (user.roles || []).some((r: any) => r.roleKey === 'admin') ||
      user.id === 1;
    const permissions = await this.menuService.getPermissionsByUserId(
      user.id,
      isAdmin,
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        sex: user.sex,
        dept: user.dept,
        roles: user.roles,
        loginIp: user.loginIp,
        loginDate: user.loginDate,
      },
      roles: (user.roles || []).map((r: any) => r.roleKey),
      permissions,
    };
  }

  private async recordLoginFail(failKey: string, currentCount: number) {
    await this.redisService.incr(failKey);
    await this.redisService.expire(failKey, 600); // 10分钟窗口
  }
}
