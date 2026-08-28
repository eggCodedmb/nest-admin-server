import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('sys_dict_data')
export class DictDataEntity {
  @ApiProperty({ description: '字典编码' })
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @ApiProperty({ description: '字典排序', default: 0 })
  @Column({ name: 'dict_sort', type: 'int', default: 0 })
  dictSort: number;

  @ApiProperty({ description: '字典标签' })
  @Column({ name: 'dict_label', length: 100 })
  dictLabel: string;

  @ApiProperty({ description: '字典键值' })
  @Column({ name: 'dict_value', length: 100 })
  dictValue: string;

  @ApiProperty({ description: '字典类型' })
  @Column({ name: 'dict_type', length: 100 })
  dictType: string;

  @ApiProperty({ description: '样式属性', required: false })
  @Column({ name: 'css_class', length: 100, nullable: true })
  cssClass: string;

  @ApiProperty({ description: '回显样式 (default/primary/danger)', required: false })
  @Column({ name: 'list_class', length: 100, nullable: true })
  listClass: string;

  @ApiProperty({ description: '是否默认 (1是 0否)', default: 0 })
  @Column({ name: 'is_default', type: 'tinyint', default: 0 })
  isDefault: number;

  @ApiProperty({ description: '状态 (0停用 1正常)', default: 1 })
  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date;
}
