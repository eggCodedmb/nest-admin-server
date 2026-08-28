import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, MaxLength } from 'class-validator';

export class CreateConfigDto {
  @ApiProperty({ description: '参数名称' })
  @IsNotEmpty({ message: '参数名称不能为空' })
  @IsString()
  @MaxLength(100)
  configName: string;

  @ApiProperty({ description: '参数键名' })
  @IsNotEmpty({ message: '参数键名不能为空' })
  @IsString()
  @MaxLength(100)
  configKey: string;

  @ApiProperty({ description: '参数键值' })
  @IsNotEmpty({ message: '参数键值不能为空' })
  @IsString()
  @MaxLength(500)
  configValue: string;

  @ApiPropertyOptional({ description: '系统内置 (1是 0否)', default: 1 })
  @IsOptional()
  @IsInt()
  configType?: number = 1;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}

export class UpdateConfigDto extends PartialType(CreateConfigDto) {
  @ApiPropertyOptional({ description: '参数ID (前端回传，实际以 URL 参数为准)' })
  @IsOptional()
  @IsInt()
  id?: number;
}
