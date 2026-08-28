import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { ClsService } from 'nestjs-cls';
import { RedisService } from '../../database/redis.service';
import { REDIS_KEYS } from '../../common/constants/redis.constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly cls: ClsService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret') || 'super_secret_jwt_key_2026',
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    if (!payload || !payload.userId) {
      throw new UnauthorizedException('无效的凭证');
    }

    // 检查 Redis 是否主动踢下线或黑名单
    const isKicked = await this.redisService.get(
      `${REDIS_KEYS.ACCESS_TOKEN_KEY}blacklist:${payload.userId}`,
    );
    if (isKicked) {
      throw new UnauthorizedException('该账号已被强制下线，请重新登录');
    }

    // 将当前操作人 userId 写入 CLS 上下文，供 AuditSubscriber 自动读取
    this.cls.set('userId', payload.userId);

    return {
      userId: payload.userId,
      username: payload.username,
      deptId: payload.deptId,
      deptName: payload.deptName,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
    };
  }
}
