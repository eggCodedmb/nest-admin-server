import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateDeptDto } from './create-dept.dto';
import { IsOptional, IsInt } from 'class-validator';

export class UpdateDeptDto extends PartialType(CreateDeptDto) {
  @ApiPropertyOptional({ description: '部门ID (前端回传，实际以 URL 参数为准)' })
  @IsOptional()
  @IsInt()
  id?: number;
}
