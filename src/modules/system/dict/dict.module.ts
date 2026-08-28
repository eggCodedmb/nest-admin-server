import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DictTypeEntity } from './entities/dict-type.entity';
import { DictDataEntity } from './entities/dict-data.entity';
import { DictService } from './dict.service';
import { DictController } from './dict.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DictTypeEntity, DictDataEntity])],
  controllers: [DictController],
  providers: [DictService],
  exports: [DictService],
})
export class DictModule {}
