import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({ description: '当前页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pageNum 必须为整数' })
  @Min(1, { message: 'pageNum 必须大于或等于 1' })
  pageNum: number = 1;

  @ApiPropertyOptional({ description: '每页条数', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pageSize 必须为整数' })
  @Min(1, { message: 'pageSize 必须大于或等于 1' })
  pageSize: number = 10;

  /** 兼容前端传 page（等同 pageNum） */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  set page(val: number) {
    if (val) this.pageNum = val;
  }

  /** 兼容前端传 limit（等同 pageSize） */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  set limit(val: number) {
    if (val) this.pageSize = val;
  }
}

export class PaginatedResponse<T> {
  rows: T[];
  total: number;
}
