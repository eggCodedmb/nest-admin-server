import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: '父级分类ID (0为顶级)', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiProperty({ description: '分类名称' })
  @IsNotEmpty({ message: '分类名称不能为空' })
  @IsString()
  @MaxLength(50, { message: '分类名称不能超过50个字符' })
  name: string;

  @ApiProperty({ description: '分类别名/Slug', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(60, { message: '分类别名不能超过60个字符' })
  slug?: string;

  @ApiProperty({ description: '分类图标或图片', required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ description: '显示顺序', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  orderNum?: number;

  @ApiProperty({ description: '分类状态 (0停用 1启用)', required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  status?: number;

  @ApiProperty({ description: '分类描述', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '分类描述不能超过500个字符' })
  description?: string;
}

export class UpdateCategoryDto extends CreateCategoryDto {}
