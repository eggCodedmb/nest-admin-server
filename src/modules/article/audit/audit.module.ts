import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntity } from './entities/audit-log.entity';
import { ArticleEntity } from '../post/entities/article.entity';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLogEntity, ArticleEntity]),
    CategoryModule,
  ],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
