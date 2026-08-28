import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateRoleDto } from './create-role.dto';
import { IsOptional, IsInt } from 'class-validator';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @ApiPropertyOptional({ description: '角色ID (前端回传，实际以 URL 参数为准)' })
  @IsOptional()
  @IsInt()
  id?: number;
}
