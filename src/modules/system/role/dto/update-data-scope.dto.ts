import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsInt, IsArray } from 'class-validator';

export class UpdateDataScopeDto {
  @ApiProperty({ description: '数据范围 (1全部 2本部门及以下 3本部门 4仅本人 5自定义)' })
  @IsNotEmpty({ message: '数据范围不能为空' })
  @IsInt()
  dataScope: number;

  @ApiPropertyOptional({ description: '自定义部门ID集合', type: [Number] })
  @IsOptional()
  @IsArray()
  deptIds?: number[];
}
