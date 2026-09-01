import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendRuleEntity } from './entities/recommend-rule.entity';
import { ArticleEntity } from '../post/entities/article.entity';
import { RecommendService } from './recommend.service';
import { RecommendController } from './recommend.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RecommendRuleEntity, ArticleEntity])],
  controllers: [RecommendController],
  providers: [RecommendService],
  exports: [RecommendService],
})
export class RecommendModule {}
