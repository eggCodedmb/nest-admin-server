import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('sys_config')
export class ConfigEntity {
  @ApiProperty({ description: '参数主键' })
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @ApiProperty({ description: '参数名称' })
  @Column({ name: 'config_name', length: 100, default: '' })
  configName: string;

  @ApiProperty({ description: '参数键名' })
  @Column({ name: 'config_key', length: 100, unique: true })
  configKey: string;

  @ApiProperty({ description: '参数键值' })
  @Column({ name: 'config_value', length: 500, default: '' })
  configValue: string;

  @ApiProperty({ description: '系统内置 (1是 0否)', default: 1 })
  @Column({ name: 'config_type', type: 'tinyint', default: 1 })
  configType: number;

  @ApiProperty({ description: '备注', required: false })
  @Column({ name: 'remark', length: 500, nullable: true })
  remark: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date;
}
