import { Module } from '@nestjs/common';
import { CategoryModule } from './category/category.module';
import { PostModule } from './post/post.module';
import { AuditModule } from './audit/audit.module';
import { RecommendModule } from './recommend/recommend.module';

@Module({
  imports: [CategoryModule, PostModule, AuditModule, RecommendModule],
  exports: [CategoryModule, PostModule, AuditModule, RecommendModule],
})
export class ArticleModule {}
