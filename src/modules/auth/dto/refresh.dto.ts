import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: '刷新令牌 (Refresh Token)' })
  @IsNotEmpty({ message: 'Refresh Token 不能为空' })
  @IsString()
  refreshToken: string;
}
