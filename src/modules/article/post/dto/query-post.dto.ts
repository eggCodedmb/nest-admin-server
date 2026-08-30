import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class QueryPostDto extends PaginationDto {
  @ApiPropertyOptional({ description: '文章标题模糊搜索' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '所属分类ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({ description: '状态 (0草稿 1待审 2发布 3驳回 4下架)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number;

  @ApiPropertyOptional({ description: '是否置顶 (0否 1是)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  isTop?: number;

  @ApiPropertyOptional({ description: '是否推荐 (0否 1是)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  isRecommend?: number;

  @ApiPropertyOptional({ description: '作者ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  authorId?: number;
}
