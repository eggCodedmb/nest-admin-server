import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { UserEntity } from '../system/user/entities/user.entity';
import { OperLogEntity } from '../system/log/entities/oper-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, OperLogEntity])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
