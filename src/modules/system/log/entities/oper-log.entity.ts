import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('sys_oper_log')
export class OperLogEntity {
  @ApiProperty({ description: '日志主键' })
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @ApiProperty({ description: '模块标题' })
  @Column({ name: 'title', length: 50, default: '' })
  title: string;

  @ApiProperty({ description: '业务类型 (1新增 2修改 3删除 4导出 5导入 0其他)' })
  @Column({ name: 'business_type', type: 'tinyint', default: 0 })
  businessType: number;

  @ApiProperty({ description: '方法名称' })
  @Column({ name: 'method', length: 100, default: '' })
  method: string;

  @ApiProperty({ description: '请求方式' })
  @Column({ name: 'request_method', length: 10, default: '' })
  requestMethod: string;

  @ApiProperty({ description: '操作人员ID', required: false })
  @Column({ name: 'oper_user_id', type: 'bigint', unsigned: true, nullable: true })
  operUserId: number;

  @ApiProperty({ description: '操作人员账号' })
  @Column({ name: 'oper_name', length: 50, default: '' })
  operName: string;

  @ApiProperty({ description: '部门名称', required: false })
  @Column({ name: 'dept_name', length: 50, nullable: true })
  deptName: string;

  @ApiProperty({ description: '请求URL' })
  @Column({ name: 'oper_url', length: 255, default: '' })
  operUrl: string;

  @ApiProperty({ description: '主机地址' })
  @Column({ name: 'oper_ip', length: 45, default: '' })
  operIp: string;

  @ApiProperty({ description: '操作地点', required: false })
  @Column({ name: 'oper_location', length: 255, default: '', nullable: true })
  operLocation: string;

  @ApiProperty({ description: '请求参数 (JSON)', required: false })
  @Column({ name: 'oper_param', type: 'json', nullable: true })
  operParam: any;

  @ApiProperty({ description: '返回参数 (JSON)', required: false })
  @Column({ name: 'json_result', type: 'json', nullable: true })
  jsonResult: any;

  @ApiProperty({ description: '操作状态 (1正常 0异常)' })
  @Column({ name: 'status', type: 'tinyint', default: 1 })
  status: number;

  @ApiProperty({ description: '错误消息', required: false })
  @Column({ name: 'error_msg', type: 'text', nullable: true })
  errorMsg: string;

  @ApiProperty({ description: '消耗时间(ms)' })
  @Column({ name: 'cost_time', type: 'bigint', default: 0 })
  costTime: number;

  @ApiProperty({ description: '操作时间' })
  @CreateDateColumn({ name: 'oper_time', type: 'datetime', precision: 3 })
  operTime: Date;
}
