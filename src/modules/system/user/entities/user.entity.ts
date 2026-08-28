import {
  Entity,
  Column,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { DeptEntity } from '../../dept/entities/dept.entity';
import { RoleEntity } from '../../role/entities/role.entity';

@Entity('sys_user')
export class UserEntity extends BaseEntity {
  @ApiProperty({ description: '部门ID', required: false })
  @Column({ name: 'dept_id', type: 'bigint', unsigned: true, nullable: true })
  deptId: number;

  @ApiProperty({ description: '用户账号' })
  @Column({ name: 'username', length: 30, unique: true })
  username: string;

  @ApiProperty({ description: '用户昵称' })
  @Column({ name: 'nickname', length: 30 })
  nickname: string;

  @ApiProperty({ description: '加密密码' })
  @Exclude({ toPlainOnly: true })
  @Column({ name: 'password', length: 100 })
  password: string;

  @ApiProperty({ description: '用户邮箱', required: false })
  @Column({ name: 'email', length: 50, nullable: true })
  email: string;

  @ApiProperty({ description: '手机号码', required: false })
  @Column({ name: 'phone', length: 11, nullable: true })
  phone: string;

  @ApiProperty({ description: '头像地址', required: false })
  @Column({ name: 'avatar', length: 255, default: '', nullable: true })
  avatar: string;

  @ApiProperty({ description: '用户性别 (0未知 1男 2女)', default: 0 })
  @Column({ name: 'sex', type: 'tinyint', default: 0 })
  sex: number;

  @ApiProperty({ description: '帐号状态 (0停用 1正常)', default: 1 })
  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @ApiProperty({ description: '最后登录IP', required: false })
  @Column({ name: 'login_ip', length: 45, nullable: true })
  loginIp: string;

  @ApiProperty({ description: '最后登录时间', required: false })
  @Column({ name: 'login_date', type: 'datetime', precision: 3, nullable: true })
  loginDate: Date;

  @ApiProperty({ description: '备注', required: false })
  @Column({ name: 'remark', length: 500, nullable: true })
  remark: string;

  @ManyToOne(() => DeptEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'dept_id' })
  dept: DeptEntity;

  @ManyToMany(() => RoleEntity)
  @JoinTable({
    name: 'sys_user_role',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: RoleEntity[];
}
