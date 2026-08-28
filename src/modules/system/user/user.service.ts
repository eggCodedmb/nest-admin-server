import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from './entities/user.entity';
import { RoleEntity } from '../role/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { DeptService } from '../dept/dept.service';
import { applyDataScope } from '../../../common/utils/data-scope.util';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly deptService: DeptService,
    private readonly dataSource: DataSource,
  ) {}

  // 1. 分页查询用户 (集成 DataScope 数据权限)
  async page(query: QueryUserDto, currentUser: any) {
    const { pageNum = 1, pageSize = 10, username, nickname, phone, deptId, status } = query;
    const qb = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.dept', 'dept')
      .leftJoinAndSelect('user.roles', 'roles');

    if (username) {
      qb.andWhere('user.username LIKE :username', { username: `%${username}%` });
    }
    if (nickname) {
      qb.andWhere('user.nickname LIKE :nickname', { nickname: `%${nickname}%` });
    }
    if (phone) {
      qb.andWhere('user.phone LIKE :phone', { phone: `%${phone}%` });
    }
    if (status !== undefined && status !== null) {
      qb.andWhere('user.status = :status', { status });
    }
    if (deptId) {
      const subDeptIds = await this.deptService.getSubDeptIds(deptId);
      qb.andWhere('user.dept_id IN (:...subDeptIds)', { subDeptIds });
    }

    // 应用数据权限过滤
    await applyDataScope(qb, currentUser, this.deptService, 'dept', 'user');

    qb.orderBy('user.id', 'DESC')
      .skip((pageNum - 1) * pageSize)
      .take(pageSize);

    const [rows, total] = await qb.getManyAndCount();
    return { rows, total };
  }

  // 2. 根据ID查询详情
  async findOne(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: { dept: true, roles: true },
    });
    if (!user) {
      throw new NotFoundException(`用户 ID ${id} 不存在`);
    }
    return {
      ...user,
      roleIds: user.roles ? user.roles.map((r) => Number(r.id)) : [],
    };
  }

  // 3. 根据用户名查询 (支持提取密码进行比对)
  async findByUsername(username: string, selectPassword = false): Promise<UserEntity | null> {
    const qb = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.dept', 'dept')
      .leftJoinAndSelect('user.roles', 'roles')
      .where('user.username = :username', { username });

    if (selectPassword) {
      qb.addSelect('user.password');
    }

    return await qb.getOne();
  }

  // 4. 新增用户 (事务绑定角色)
  async create(dto: CreateUserDto) {
    const exists = await this.userRepo.findOneBy({ username: dto.username });
    if (exists) {
      throw new BadRequestException(`用户账号 ${dto.username} 已存在`);
    }

    const rawPassword = dto.password || '123456';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    return await this.dataSource.transaction(async (manager) => {
      const user = manager.create(UserEntity, {
        username: dto.username,
        nickname: dto.nickname,
        password: hashedPassword,
        deptId: dto.deptId,
        email: dto.email,
        phone: dto.phone,
        sex: dto.sex ?? 0,
        avatar: dto.avatar,
        status: dto.status ?? 1,
        remark: dto.remark,
      });

      const savedUser = await manager.save(user);

      if (dto.roleIds && dto.roleIds.length > 0) {
        const roles = await manager.findBy(RoleEntity, { id: In(dto.roleIds) });
        savedUser.roles = roles;
        await manager.save(savedUser);
      }

      return savedUser;
    });
  }

  // 5. 修改用户
  async update(id: number, dto: UpdateUserDto) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: { roles: true },
    });
    if (!user) {
      throw new NotFoundException(`用户 ID ${id} 不存在`);
    }

    if (dto.username && dto.username !== user.username) {
      const exists = await this.userRepo.findOneBy({ username: dto.username });
      if (exists) {
        throw new BadRequestException(`用户账号 ${dto.username} 已存在`);
      }
    }

    return await this.dataSource.transaction(async (manager) => {
      Object.assign(user, {
        username: dto.username ?? user.username,
        nickname: dto.nickname ?? user.nickname,
        deptId: dto.deptId !== undefined ? dto.deptId : user.deptId,
        email: dto.email !== undefined ? dto.email : user.email,
        phone: dto.phone !== undefined ? dto.phone : user.phone,
        sex: dto.sex !== undefined ? dto.sex : user.sex,
        avatar: dto.avatar !== undefined ? dto.avatar : user.avatar,
        status: dto.status !== undefined ? dto.status : user.status,
        remark: dto.remark !== undefined ? dto.remark : user.remark,
      });

      if (dto.roleIds !== undefined) {
        user.roles = dto.roleIds.length > 0
          ? await manager.findBy(RoleEntity, { id: In(dto.roleIds) })
          : [];
      }

      return await manager.save(user);
    });
  }

  // 6. 重置密码
  async resetPassword(id: number, dto: ResetPasswordDto) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`用户 ID ${id} 不存在`);
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    await this.userRepo.update(id, { password: hashedPassword });
    return { message: '密码重置成功' };
  }

  // 7. 修改状态
  async changeStatus(id: number, status: number) {
    if (id === 1) {
      throw new BadRequestException('不能停用超级管理员账号');
    }
    await this.userRepo.update(id, { status });
    return { message: '状态更新成功' };
  }

  // 8. 记录登录信息
  async updateLoginInfo(id: number, ip: string) {
    await this.userRepo.update(id, {
      loginIp: ip,
      loginDate: new Date(),
    });
  }

  // 9. 删除用户
  async remove(id: number) {
    if (id === 1) {
      throw new BadRequestException('超级管理员账号不允许删除');
    }
    await this.userRepo.softDelete(id);
    return { message: '删除成功' };
  }
}
