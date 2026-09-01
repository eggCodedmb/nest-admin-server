import { PartialType } from '@nestjs/swagger';
import { CreateRecommendRuleDto } from './create-recommend-rule.dto';

export class UpdateRecommendRuleDto extends PartialType(CreateRecommendRuleDto) {}
