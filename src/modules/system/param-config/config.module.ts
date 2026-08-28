import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigEntity } from './entities/config.entity';
import { ParamConfigService } from './config.service';
import { ParamConfigController } from './config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ConfigEntity])],
  controllers: [ParamConfigController],
  providers: [ParamConfigService],
  exports: [ParamConfigService],
})
export class ParamConfigModule {}
