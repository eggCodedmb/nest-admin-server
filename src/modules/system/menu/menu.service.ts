import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MenuEntity } from './entities/menu.entity';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { buildTree } from '../../../common/utils/tree.util';

export interface RouteVo {
  name: string;
  path: string;
  hidden: boolean;
  redirect?: string;
  component: string;
  alwaysShow?: boolean;
  meta: {
    title: string;
    icon: string;
    noCache: boolean;
    link?: string;
  };
  children?: RouteVo[];
}

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuEntity)
    private readonly menuRepo: Repository<MenuEntity>,
  ) {}

  // 1. 查询全部菜单列表
  async findAll(query?: { menuName?: string; status?: number }) {
    const qb = this.menuRepo.createQueryBuilder('menu');
    if (query?.menuName) {
      qb.andWhere('menu.menu_name LIKE :menuName', { menuName: `%${query.menuName}%` });
    }
    if (query?.status !== undefined && query?.status !== null) {
      qb.andWhere('menu.status = :status', { status: query.status });
    }
    qb.orderBy('menu.order_num', 'ASC');
    return await qb.getMany();
  }

  // 2. 获取菜单树
  async getTree(query?: { menuName?: string; status?: number }) {
    const list = await this.findAll(query);
    return buildTree(list, 'id', 'parentId', 'children');
  }

  // 3. 根据ID查询详情
  async findOne(id: number): Promise<MenuEntity> {
    const menu = await this.menuRepo.findOneBy({ id });
    if (!menu) {
      throw new NotFoundException(`菜单 ID ${id} 不存在`);
    }
    return menu;
  }

  // 4. 新增菜单
  async create(dto: CreateMenuDto): Promise<MenuEntity> {
    const parentId = dto.parentId || 0;
    let mpath = '';
    if (parentId > 0) {
      const parent = await this.menuRepo.findOneBy({ id: parentId });
      if (!parent) {
        throw new BadRequestException('父级菜单不存在');
      }
      mpath = `${parent.mpath || `${parent.id}.`}`;
    }

    const menu = this.menuRepo.create({
      ...dto,
      parentId,
      mpath,
    });
    const saved = await this.menuRepo.save(menu);
    saved.mpath = `${mpath}${saved.id}.`;
    return await this.menuRepo.save(saved);
  }

  // 5. 修改菜单
  async update(id: number, dto: UpdateMenuDto): Promise<MenuEntity> {
    const menu = await this.findOne(id);
    if (dto.parentId !== undefined && dto.parentId === id) {
      throw new BadRequestException('上级菜单不能为当前菜单自身');
    }

    const { id: _id, ...updatePayload } = dto;
    Object.assign(menu, updatePayload);
    if (dto.parentId !== undefined) {
      if (dto.parentId === 0) {
        menu.mpath = `${id}.`;
      } else {
        const parent = await this.menuRepo.findOneBy({ id: dto.parentId });
        if (parent) {
          menu.mpath = `${parent.mpath || `${parent.id}.`}${id}.`;
        }
      }
    }
    return await this.menuRepo.save(menu);
  }

  // 6. 删除菜单
  async remove(id: number): Promise<void> {
    const childCount = await this.menuRepo.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new BadRequestException('存在子菜单或按钮，不允许删除');
    }
    await this.menuRepo.delete(id);
  }

  // 7. 根据用户ID获取权限标识集合
  async getPermissionsByUserId(userId: number, isAdmin: boolean = false): Promise<string[]> {
    if (isAdmin || userId === 1) {
      return ['*:*:*'];
    }

    const menus = await this.menuRepo
      .createQueryBuilder('m')
      .innerJoin('sys_role_menu', 'rm', 'rm.menu_id = m.id')
      .innerJoin('sys_user_role', 'ur', 'ur.role_id = rm.role_id')
      .where('ur.user_id = :userId', { userId })
      .andWhere('m.status = 1')
      .andWhere('m.perms IS NOT NULL AND m.perms != ""')
      .select('m.perms', 'perms')
      .getRawMany();

    const permsSet = new Set<string>();
    menus.forEach((item) => {
      if (item.perms) {
        item.perms.split(',').forEach((p: string) => permsSet.add(p.trim()));
      }
    });

    return Array.from(permsSet);
  }

  // 8. 根据用户ID获取菜单树并转换为前端动态路由
  async getRoutersByUserId(userId: number, isAdmin: boolean = false): Promise<RouteVo[]> {
    let menus: MenuEntity[];
    if (isAdmin || userId === 1) {
      menus = await this.menuRepo
        .createQueryBuilder('m')
        .where('m.status = 1')
        .andWhere('m.menu_type IN (:...types)', { types: ['M', 'C'] })
        .orderBy('m.order_num', 'ASC')
        .getMany();
    } else {
      menus = await this.menuRepo
        .createQueryBuilder('m')
        .innerJoin('sys_role_menu', 'rm', 'rm.menu_id = m.id')
        .innerJoin('sys_user_role', 'ur', 'ur.role_id = rm.role_id')
        .where('ur.user_id = :userId', { userId })
        .andWhere('m.status = 1')
        .andWhere('m.menu_type IN (:...types)', { types: ['M', 'C'] })
        .distinct(true)
        .orderBy('m.order_num', 'ASC')
        .getMany();
    }

    const tree = buildTree(menus, 'id', 'parentId', 'children');
    return this.buildRoutesVo(tree);
  }

  private buildRoutesVo(menus: any[]): RouteVo[] {
    const routers: RouteVo[] = [];
    for (const menu of menus) {
      const isDir = menu.menuType === 'M';
      const isFrame = menu.isFrame === 1;
      const router: RouteVo = {
        name: this.capitalize(menu.path || menu.menuName),
        path: isDir && !menu.path.startsWith('/') ? `/${menu.path}` : menu.path,
        hidden: menu.visible === 0,
        component: menu.component || (isDir ? 'Layout' : 'ParentView'),
        meta: {
          title: menu.menuName,
          icon: menu.icon,
          noCache: menu.isCache === 0,
          link: isFrame ? menu.path : undefined,
        },
      };

      if (menu.children && menu.children.length > 0) {
        router.children = this.buildRoutesVo(menu.children);
        router.alwaysShow = isDir;
      }
      routers.push(router);
    }
    return routers;
  }

  private capitalize(str: string): string {
    if (!str) return '';
    const clean = str.replace(/[^a-zA-Z0-9]/g, '');
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
}
