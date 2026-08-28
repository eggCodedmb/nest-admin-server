import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class IdDto {
  @ApiProperty({ description: '主键ID' })
  @Type(() => Number)
  @IsInt({ message: 'id 必须为整数' })
  @Min(1, { message: 'id 必须大于 0' })
  id: number;
}
