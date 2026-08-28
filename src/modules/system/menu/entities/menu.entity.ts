import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('sys_menu')
export class MenuEntity {
  @ApiProperty({ description: '菜单ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @ApiProperty({ description: '父菜单ID (0为顶级)', default: 0 })
  @Column({ name: 'parent_id', type: 'bigint', unsigned: true, default: 0 })
  parentId: number;

  @ApiProperty({ description: '物化路径', default: '' })
  @Column({ name: 'mpath', length: 255, default: '' })
  mpath: string;

  @ApiProperty({ description: '菜单名称' })
  @Column({ name: 'menu_name', length: 50 })
  menuName: string;

  @ApiProperty({ description: '显示顺序', default: 0 })
  @Column({ name: 'order_num', type: 'int', default: 0 })
  orderNum: number;

  @ApiProperty({ description: '路由地址', default: '', required: false })
  @Column({ name: 'path', length: 200, default: '' })
  path: string;

  @ApiProperty({ description: '组件路径', required: false })
  @Column({ name: 'component', length: 255, nullable: true })
  component: string;

  @ApiProperty({ description: '是否为外链 (0否 1是)', default: 0 })
  @Column({ name: 'is_frame', type: 'tinyint', default: 0 })
  isFrame: number;

  @ApiProperty({ description: '是否缓存 (0不缓存 1缓存)', default: 1 })
  @Column({ name: 'is_cache', type: 'tinyint', default: 1 })
  isCache: number;

  @ApiProperty({ description: '菜单类型 (M目录 C菜单 F按钮)' })
  @Column({ name: 'menu_type', type: 'char', length: 1 })
  menuType: string;

  @ApiProperty({ description: '显示状态 (0隐藏 1显示)', default: 1 })
  @Column({ name: 'visible', type: 'tinyint', default: 1 })
  visible: number;

  @ApiProperty({ description: '菜单状态 (0停用 1正常)', default: 1 })
  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @ApiProperty({ description: '权限标识 (如: sys:user:add)', required: false })
  @Column({ name: 'perms', length: 100, nullable: true })
  perms: string;

  @ApiProperty({ description: '菜单图标', default: '#', required: false })
  @Column({ name: 'icon', length: 100, default: '#' })
  icon: string;

  @ApiProperty({ description: '备注', required: false })
  @Column({ name: 'remark', length: 500, nullable: true })
  remark: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date;

  children?: MenuEntity[];
}
