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

@Entity('sys_dept')
@Tree('materialized-path')
export class DeptEntity {
  @ApiProperty({ description: '部门ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @ApiProperty({ description: '部门名称' })
  @Column({ name: 'dept_name', length: 50 })
  deptName: string;

  @ApiProperty({ description: '显示顺序', default: 0 })
  @Column({ name: 'order_num', type: 'int', default: 0 })
  orderNum: number;

  @ApiProperty({ description: '负责人', required: false })
  @Column({ name: 'leader', length: 30, nullable: true })
  leader: string;

  @ApiProperty({ description: '联系电话', required: false })
  @Column({ name: 'phone', length: 11, nullable: true })
  phone: string;

  @ApiProperty({ description: '邮箱', required: false })
  @Column({ name: 'email', length: 50, nullable: true })
  email: string;

  @ApiProperty({ description: '部门状态 (0停用 1正常)', default: 1 })
  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

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
  parent: DeptEntity;

  @RelationId((dept: DeptEntity) => dept.parent)
  parentId: number;

  @TreeChildren()
  children: DeptEntity[];
}
