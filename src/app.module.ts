import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import jwtConfig from './config/jwt.config';

import { DatabaseModule } from './database/database.module';
import { RedisModule } from './database/redis.module';
import { CaslModule } from './modules/casl/casl.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/system/user/user.module';
import { RoleModule } from './modules/system/role/role.module';
import { MenuModule } from './modules/system/menu/menu.module';
import { DeptModule } from './modules/system/dept/dept.module';
import { DictModule } from './modules/system/dict/dict.module';
import { ParamConfigModule } from './modules/system/param-config/config.module';
import { LogModule } from './modules/system/log/log.module';
import { ToolsModule } from './modules/tools/tools.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ArticleModule } from './modules/article/article.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PoliciesGuard } from './common/guards/policies.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { GlobalExceptionsFilter } from './common/filters/global-exceptions.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, redisConfig, jwtConfig],
      envFilePath: ['.env.development', '.env'],
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: process.env.THROTTLE_LIMIT
          ? parseInt(process.env.THROTTLE_LIMIT, 10)
          : 50000,
      },
    ]),
    DatabaseModule,
    RedisModule,
    CaslModule,
    AuthModule,
    UserModule,
    RoleModule,
    MenuModule,
    DeptModule,
    DictModule,
    ParamConfigModule,
    LogModule,
    ToolsModule,
    DashboardModule,
    ArticleModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PoliciesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionsFilter,
    },
  ],
})
export class AppModule {}
