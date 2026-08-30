import { Module } from '@nestjs/common';
import { CategoryModule } from './category/category.module';
import { PostModule } from './post/post.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [CategoryModule, PostModule, AuditModule],
  exports: [CategoryModule, PostModule, AuditModule],
})
export class ArticleModule {}
