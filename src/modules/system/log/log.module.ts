import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperLogEntity } from './entities/oper-log.entity';
import { OperLogService } from './oper-log.service';
import { OperLogController } from './oper-log.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OperLogEntity])],
  controllers: [OperLogController],
  providers: [OperLogService],
  exports: [OperLogService, TypeOrmModule],
})
export class LogModule {}
