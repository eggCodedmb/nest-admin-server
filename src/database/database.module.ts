import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AuditSubscriber } from '../common/subscribers/audit.subscriber';
import { DeptEntity } from '../modules/system/dept/entities/dept.entity';
import { UserEntity } from '../modules/system/user/entities/user.entity';
import { RoleEntity } from '../modules/system/role/entities/role.entity';
import { MenuEntity } from '../modules/system/menu/entities/menu.entity';
import { DictTypeEntity } from '../modules/system/dict/entities/dict-type.entity';
import { DictDataEntity } from '../modules/system/dict/entities/dict-data.entity';
import { ConfigEntity } from '../modules/system/param-config/entities/config.entity';
import { OperLogEntity } from '../modules/system/log/entities/oper-log.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        return {
          type: 'mysql',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          namingStrategy: new SnakeNamingStrategy(),
          entities: [
            DeptEntity,
            UserEntity,
            RoleEntity,
            MenuEntity,
            DictTypeEntity,
            DictDataEntity,
            ConfigEntity,
            OperLogEntity,
          ],
          subscribers: [AuditSubscriber],
          synchronize: false,
          logging: dbConfig.logging,
          timezone: '+08:00',
          charset: 'utf8mb4_0900_ai_ci',
          extra: {
            connectionLimit: 10,
          },
        };
      },
    }),
  ],
  providers: [AuditSubscriber],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
