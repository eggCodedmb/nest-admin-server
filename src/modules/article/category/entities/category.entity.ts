import {
  Entity,
  Column,
  Tree,
  TreeChildren,
  TreeParent,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  RelationId,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('art_category')
@Tree('materialized-path')
export class CategoryEntity {
  @ApiProperty({ description: '分类ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @ApiProperty({ description: '分类名称' })
  @Column({ length: 50 })
  name: string;

  @ApiProperty({ description: '英文别名/Slug', required: false })
  @Column({ length: 60, nullable: true })
  slug: string;

  @ApiProperty({ description: '分类图标或图片', required: false })
  @Column({ length: 255, nullable: true })
  icon: string;

  @ApiProperty({ description: '显示顺序', default: 0 })
  @Column({ name: 'order_num', type: 'int', default: 0 })
  orderNum: number;

  @ApiProperty({ description: '分类状态 (0停用 1启用)', default: 1 })
  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @ApiProperty({ description: '分类描述', required: false })
  @Column({ length: 500, nullable: true })
  description: string;

  @ApiProperty({ description: '创建者ID', required: false })
  @Column({ name: 'created_by', type: 'bigint', unsigned: true, nullable: true })
  createdBy: number;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @ApiProperty({ description: '更新者ID', required: false })
  @Column({ name: 'updated_by', type: 'bigint', unsigned: true, nullable: true })
  updatedBy: number;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date;

  @ApiProperty({ description: '软删除时间', required: false })
  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', precision: 3, nullable: true })
  deletedAt: Date;

  @TreeParent()
  parent: CategoryEntity;

  @RelationId((category: CategoryEntity) => category.parent)
  parentId: number;

  @TreeChildren()
  children: CategoryEntity[];
}
