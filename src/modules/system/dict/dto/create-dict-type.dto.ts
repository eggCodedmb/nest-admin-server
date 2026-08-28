import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, MaxLength } from 'class-validator';

export class CreateDictTypeDto {
  @ApiProperty({ description: '字典名称' })
  @IsNotEmpty({ message: '字典名称不能为空' })
  @IsString()
  @MaxLength(100)
  dictName: string;

  @ApiProperty({ description: '字典类型' })
  @IsNotEmpty({ message: '字典类型不能为空' })
  @IsString()
  @MaxLength(100)
  dictType: string;

  @ApiPropertyOptional({ description: '状态 (0停用 1正常)', default: 1 })
  @IsOptional()
  @IsInt()
  status?: number = 1;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}

export class UpdateDictTypeDto extends PartialType(CreateDictTypeDto) {
  @ApiPropertyOptional({ description: '字典类型ID (前端回传，实际以 URL 参数为准)' })
  @IsOptional()
  @IsInt()
  id?: number;
}
