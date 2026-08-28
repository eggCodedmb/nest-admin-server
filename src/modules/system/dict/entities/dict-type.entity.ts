import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('sys_dict_type')
export class DictTypeEntity {
  @ApiProperty({ description: '字典主键' })
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @ApiProperty({ description: '字典名称' })
  @Column({ name: 'dict_name', length: 100 })
  dictName: string;

  @ApiProperty({ description: '字典类型唯一标识' })
  @Column({ name: 'dict_type', length: 100, unique: true })
  dictType: string;

  @ApiProperty({ description: '状态 (0停用 1正常)', default: 1 })
  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

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
