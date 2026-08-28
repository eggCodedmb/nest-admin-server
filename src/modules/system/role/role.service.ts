import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { RoleEntity } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { UpdateDataScopeDto } from './dto/update-data-scope.dto';
import { MenuEntity } from '../menu/entities/menu.entity';
import { DeptEntity } from '../dept/entities/dept.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // 1. 分页查询角色
  async page(query: QueryRoleDto) {
    const { pageNum = 1, pageSize = 10, roleName, roleKey, status } = query;
    const qb = this.roleRepo.createQueryBuilder('role');

    if (roleName) {
      qb.andWhere('role.role_name LIKE :roleName', { roleName: `%${roleName}%` });
    }
    if (roleKey) {
      qb.andWhere('role.role_key LIKE :roleKey', { roleKey: `%${roleKey}%` });
    }
    if (status !== undefined && status !== null) {
      qb.andWhere('role.status = :status', { status });
    }

    qb.orderBy('role.order_num', 'ASC')
      .skip((pageNum - 1) * pageSize)
      .take(pageSize);

    const [rows, total] = await qb.getManyAndCount();
    return { rows, total };
  }

  // 2. 获取全部正常角色列表
  async findAll() {
    return await this.roleRepo.find({
      where: { status: 1 },
      order: { orderNum: 'ASC' },
    });
  }

  // 3. 查询角色详情及绑定的菜单与部门
  async findOne(id: number) {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: { menus: true, depts: true },
    });
    if (!role) {
      throw new NotFoundException(`角色 ID ${id} 不存在`);
    }
    return {
      ...role,
      menuIds: role.menus ? role.menus.map((m) => Number(m.id)) : [],
      deptIds: role.depts ? role.depts.map((d) => Number(d.id)) : [],
    };
  }

  // 4. 新增角色 (事务处理关联)
  async create(dto: CreateRoleDto) {
    const exists = await this.roleRepo.findOneBy({ roleKey: dto.roleKey });
    if (exists) {
      throw new BadRequestException(`角色权限字符 ${dto.roleKey} 已存在`);
    }

    return await this.dataSource.transaction(async (manager) => {
      const role = manager.create(RoleEntity, {
        roleName: dto.roleName,
        roleKey: dto.roleKey,
        orderNum: dto.orderNum ?? 0,
        dataScope: dto.dataScope ?? 1,
        status: dto.status ?? 1,
        remark: dto.remark,
      });

      const savedRole = await manager.save(role);

      // 绑定菜单
      if (dto.menuIds && dto.menuIds.length > 0) {
        const menus = await manager.findBy(MenuEntity, { id: In(dto.menuIds) });
        savedRole.menus = menus;
        await manager.save(savedRole);
      }

      // 绑定部门
      if (dto.deptIds && dto.deptIds.length > 0) {
        const depts = await manager.findBy(DeptEntity, { id: In(dto.deptIds) });
        savedRole.depts = depts;
        await manager.save(savedRole);
      }

      return savedRole;
    });
  }

  // 5. 修改角色
  async update(id: number, dto: UpdateRoleDto) {
    if (id === 1) {
      throw new BadRequestException('超级管理员角色不允许修改');
    }

    const role = await this.roleRepo.findOne({
      where: { id },
      relations: { menus: true, depts: true },
    });
    if (!role) {
      throw new NotFoundException(`角色 ID ${id} 不存在`);
    }

    if (dto.roleKey && dto.roleKey !== role.roleKey) {
      const exists = await this.roleRepo.findOneBy({ roleKey: dto.roleKey });
      if (exists) {
        throw new BadRequestException(`角色权限字符 ${dto.roleKey} 已存在`);
      }
    }

    return await this.dataSource.transaction(async (manager) => {
      Object.assign(role, {
        roleName: dto.roleName ?? role.roleName,
        roleKey: dto.roleKey ?? role.roleKey,
        orderNum: dto.orderNum ?? role.orderNum,
        dataScope: dto.dataScope ?? role.dataScope,
        status: dto.status ?? role.status,
        remark: dto.remark ?? role.remark,
      });

      if (dto.menuIds !== undefined) {
        role.menus = dto.menuIds.length > 0
          ? await manager.findBy(MenuEntity, { id: In(dto.menuIds) })
          : [];
      }

      if (dto.deptIds !== undefined) {
        role.depts = dto.deptIds.length > 0
          ? await manager.findBy(DeptEntity, { id: In(dto.deptIds) })
          : [];
      }

      return await manager.save(role);
    });
  }

  // 6. 数据权限分配
  async updateDataScope(id: number, dto: UpdateDataScopeDto) {
    if (id === 1) {
      throw new BadRequestException('超级管理员角色不需要修改数据权限');
    }
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: { depts: true },
    });
    if (!role) {
      throw new NotFoundException(`角色 ID ${id} 不存在`);
    }

    return await this.dataSource.transaction(async (manager) => {
      role.dataScope = dto.dataScope;
      if (dto.dataScope === 5 && dto.deptIds && dto.deptIds.length > 0) {
        role.depts = await manager.findBy(DeptEntity, { id: In(dto.deptIds) });
      } else {
        role.depts = [];
      }
      return await manager.save(role);
    });
  }

  // 7. 切换角色状态
  async changeStatus(id: number, status: number) {
    if (id === 1) {
      throw new BadRequestException('不能停用超级管理员角色');
    }
    await this.roleRepo.update(id, { status });
    return { message: '状态更新成功' };
  }

  // 8. 删除角色
  async remove(id: number) {
    if (id === 1) {
      throw new BadRequestException('超级管理员角色不允许删除');
    }
    await this.roleRepo.softDelete(id);
    return { message: '删除成功' };
  }
}
