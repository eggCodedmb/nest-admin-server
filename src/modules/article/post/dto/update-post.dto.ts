import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreatePostDto } from './create-post.dto';
import { IsOptional } from 'class-validator';

export class UpdatePostDto extends PartialType(CreatePostDto) {
  @ApiProperty({ description: '文章ID', required: false })
  @IsOptional()
  id?: any;
}

