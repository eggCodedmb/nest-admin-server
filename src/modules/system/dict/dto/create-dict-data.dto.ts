import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, MaxLength } from 'class-validator';

export class CreateDictDataDto {
  @ApiPropertyOptional({ description: '字典排序', default: 0 })
  @IsOptional()
  @IsInt()
  dictSort?: number = 0;

  @ApiProperty({ description: '字典标签' })
  @IsNotEmpty({ message: '字典标签不能为空' })
  @IsString()
  @MaxLength(100)
  dictLabel: string;

  @ApiProperty({ description: '字典键值' })
  @IsNotEmpty({ message: '字典键值不能为空' })
  @IsString()
  @MaxLength(100)
  dictValue: string;

  @ApiProperty({ description: '字典类型' })
  @IsNotEmpty({ message: '字典类型不能为空' })
  @IsString()
  @MaxLength(100)
  dictType: string;

  @ApiPropertyOptional({ description: '样式属性' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  cssClass?: string;

  @ApiPropertyOptional({ description: '回显样式 (default/primary/danger)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  listClass?: string;

  @ApiPropertyOptional({ description: '是否默认 (1是 0否)', default: 0 })
  @IsOptional()
  @IsInt()
  isDefault?: number = 0;

  @ApiPropertyOptional({ description: '状态 (0停用 1正常)', default: 1 })
  @IsOptional()
  @IsInt()
  status?: number = 1;
}

export class UpdateDictDataDto extends PartialType(CreateDictDataDto) {
  @ApiPropertyOptional({ description: '字典数据ID (前端回传，实际以 URL 参数为准)' })
  @IsOptional()
  @IsInt()
  id?: number;
}
