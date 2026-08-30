import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, IsIn } from 'class-validator';

export class AuditActionDto {
  @ApiProperty({ description: '文章ID' })
  @IsNotEmpty({ message: '文章ID不能为空' })
  @IsNumber()
  articleId: number;

  @ApiProperty({ description: '审核动作 (1通过 2驳回 3下架)' })
  @IsNotEmpty({ message: '审核动作不能为空' })
  @IsNumber()
  @IsIn([1, 2, 3], { message: '审核动作无效 (1通过 2驳回 3下架)' })
  auditResult: number;

  @ApiProperty({ description: '审核批注/驳回原因 (驳回时建议必填)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: '批注原因不能超过1000个字符' })
  auditComment?: string;
}
