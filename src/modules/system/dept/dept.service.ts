import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TreeRepository, Repository } from 'typeorm';
import { DeptEntity } from './entities/dept.entity';
import { CreateDeptDto } from './dto/create-dept.dto';
import { UpdateDeptDto } from './dto/update-dept.dto';

import { buildTree } from '../../../common/utils/tree.util';

@Injectable()
export class DeptService {
  constructor(
    @InjectRepository(DeptEntity)
    private readonly deptTreeRepo: TreeRepository<DeptEntity>,
    @InjectRepository(DeptEntity)
    private readonly deptRepo: Repository<DeptEntity>,
  ) {}

  // 1. 获取完整部门树 (支持条件检索)
  async getTree(query?: { deptName?: string; status?: number }): Promise<DeptEntity[]> {
    if (query?.deptName || (query?.status !== undefined && query?.status !== null)) {
      const list = await this.findAll(query);
      return buildTree(list, 'id', 'parentId', 'children');
    }
    return await this.deptTreeRepo.findTrees();
  }

  // 2. 获取指定部门及所有子孙部门ID
  async getSubDeptIds(deptId: number): Promise<number[]> {
    const rootDept = await this.deptTreeRepo.findOneBy({ id: deptId });
    if (!rootDept) return [deptId];
    const descendants = await this.deptTreeRepo.findDescendants(rootDept);
    return descendants.map((d) => Number(d.id));
  }

  // 3. 部门列表查询
  async findAll(query?: { deptName?: string; status?: number }) {
    const qb = this.deptRepo.createQueryBuilder('dept')
      .leftJoinAndSelect('dept.parent', 'parent');
    if (query?.deptName) {
      qb.andWhere('dept.dept_name LIKE :deptName', { deptName: `%${query.deptName}%` });
    }
    if (query?.status !== undefined && query?.status !== null) {
      qb.andWhere('dept.status = :status', { status: query.status });
    }
    qb.orderBy('dept.order_num', 'ASC');
    const list = await qb.getMany();
    return list.map((item) => ({
      ...item,
      parentId: item.parent ? Number(item.parent.id) : 0,
    }));
  }

  // 4. 查询部门详情
  async findOne(id: number): Promise<DeptEntity> {
    const dept = await this.deptRepo.findOne({
      where: { id },
      relations: { parent: true },
    });
    if (!dept) {
      throw new NotFoundException(`部门 ID ${id} 不存在`);
    }
    return {
      ...dept,
      parentId: dept.parent ? Number(dept.parent.id) : 0,
    } as DeptEntity;
  }

  // 5. 新增部门
  async create(dto: CreateDeptDto): Promise<DeptEntity> {
    const dept = this.deptRepo.create({
      deptName: dto.deptName,
      orderNum: dto.orderNum,
      leader: dto.leader,
      phone: dto.phone,
      email: dto.email,
      status: dto.status ?? 1,
    });

    if (dto.parentId && dto.parentId > 0) {
      const parent = await this.deptRepo.findOneBy({ id: dto.parentId });
      if (!parent) {
        throw new BadRequestException('父级部门不存在');
      }
      dept.parent = parent;
    }

    const saved = await this.deptTreeRepo.save(dept);
    return saved;
  }

  // 6. 更新部门
  async update(id: number, dto: UpdateDeptDto): Promise<DeptEntity> {
    const dept = await this.findOne(id);

    if (dto.parentId !== undefined && dto.parentId === id) {
      throw new BadRequestException('上级部门不能为当前部门自身');
    }

    if (dto.parentId !== undefined && dto.parentId > 0) {
      const subDeptIds = await this.getSubDeptIds(id);
      if (subDeptIds.includes(dto.parentId)) {
        throw new BadRequestException('上级部门不能为当前部门的子部门');
      }
      const parent = await this.deptRepo.findOneBy({ id: dto.parentId });
      if (!parent) {
        throw new BadRequestException('父级部门不存在');
      }
      dept.parent = parent;
    } else if (dto.parentId === 0) {
      dept.parent = null as any;
    }

    Object.assign(dept, {
      deptName: dto.deptName ?? dept.deptName,
      orderNum: dto.orderNum ?? dept.orderNum,
      leader: dto.leader ?? dept.leader,
      phone: dto.phone ?? dept.phone,
      email: dto.email ?? dept.email,
      status: dto.status ?? dept.status,
    });

    return await this.deptTreeRepo.save(dept);
  }

  // 7. 删除部门
  async remove(id: number): Promise<void> {
    const subDeptIds = await this.getSubDeptIds(id);
    if (subDeptIds.length > 1) {
      throw new BadRequestException('存在子部门，不允许删除');
    }
    await this.deptRepo.softDelete(id);
  }
}
