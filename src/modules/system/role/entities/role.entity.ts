import {
  Entity,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { MenuEntity } from '../../menu/entities/menu.entity';
import { DeptEntity } from '../../dept/entities/dept.entity';

@Entity('sys_role')
export class RoleEntity extends BaseEntity {
  @ApiProperty({ description: '角色名称' })
  @Column({ name: 'role_name', length: 30 })
  roleName: string;

  @ApiProperty({ description: '角色权限字符 (如: admin, common)' })
  @Column({ name: 'role_key', length: 100, unique: true })
  roleKey: string;

  @ApiProperty({ description: '显示顺序', default: 0 })
  @Column({ name: 'order_num', type: 'int', default: 0 })
  orderNum: number;

  @ApiProperty({ description: '数据范围 (1全部 2本部门及以下 3本部门 4仅本人 5自定义)', default: 1 })
  @Column({ name: 'data_scope', type: 'tinyint', default: 1 })
  dataScope: number;

  @ApiProperty({ description: '角色状态 (0停用 1正常)', default: 1 })
  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @ApiProperty({ description: '备注', required: false })
  @Column({ name: 'remark', length: 500, nullable: true })
  remark: string;

  @ManyToMany(() => MenuEntity)
  @JoinTable({
    name: 'sys_role_menu',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'menu_id', referencedColumnName: 'id' },
  })
  menus: MenuEntity[];

  @ManyToMany(() => DeptEntity)
  @JoinTable({
    name: 'sys_role_dept',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'dept_id', referencedColumnName: 'id' },
  })
  depts: DeptEntity[];
}
