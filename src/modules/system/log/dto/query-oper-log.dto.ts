import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class QueryOperLogDto extends PaginationDto {
  @ApiPropertyOptional({ description: '模块标题' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '操作人员账号' })
  @IsOptional()
  @IsString()
  operName?: string;

  @ApiPropertyOptional({ description: '业务类型 (1新增 2修改 3删除 4导出 5导入 0其他)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  businessType?: number;

  @ApiPropertyOptional({ description: '操作状态 (1正常 0异常)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;
}
