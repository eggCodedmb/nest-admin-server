import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateMenuDto } from './create-menu.dto';
import { IsOptional, IsInt } from 'class-validator';

export class UpdateMenuDto extends PartialType(CreateMenuDto) {
  @ApiPropertyOptional({ description: '菜单ID (前端回传，实际以 URL 参数为准)' })
  @IsOptional()
  @IsInt()
  id?: number;
}
