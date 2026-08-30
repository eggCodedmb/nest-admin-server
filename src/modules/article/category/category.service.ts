import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TreeRepository, Repository, DataSource } from 'typeorm';
import { CategoryEntity } from './entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { buildTree } from '../../../common/utils/tree.util';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryTreeRepo: TreeRepository<CategoryEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // 1. 获取分类树
  async getTree(query?: QueryCategoryDto): Promise<CategoryEntity[]> {
    const list = await this.findAll(query);
    return buildTree(list, 'id', 'parentId', 'children');
  }

  // 2. 获取平铺分类列表
  async findAll(query?: QueryCategoryDto) {
    const qb = this.categoryRepo.createQueryBuilder('cat');

    if (query?.name) {
      qb.andWhere('cat.name LIKE :name', { name: `%${query.name}%` });
    }
    if (query?.status !== undefined && query?.status !== null) {
      qb.andWhere('cat.status = :status', { status: query.status });
    }

    qb.orderBy('cat.order_num', 'ASC').addOrderBy('cat.id', 'ASC');
    const list = await qb.getMany();
    return list.map((item) => ({
      ...item,
      id: Number(item.id),
      parentId: Number(item.parentId || 0),
    }));
  }

  // 3. 获取子分类ID列表
  async getSubCategoryIds(categoryId: number): Promise<number[]> {
    const all = await this.findAll();
    const subIds: number[] = [Number(categoryId)];

    const findChildren = (pid: number) => {
      all.forEach((item) => {
        if (item.parentId === pid) {
          subIds.push(item.id);
          findChildren(item.id);
        }
      });
    };

    findChildren(Number(categoryId));
    return subIds;
  }

  // 4. 查询详情
  async findOne(id: number): Promise<CategoryEntity> {
    const cat = await this.categoryRepo.findOne({
      where: { id },
      relations: { parent: true },
    });
    if (!cat) {
      throw new NotFoundException(`分类 ID ${id} 不存在`);
    }
    return {
      ...cat,
      parentId: cat.parent ? Number(cat.parent.id) : 0,
    } as CategoryEntity;
  }

  // 5. 新增分类
  async create(dto: CreateCategoryDto): Promise<CategoryEntity> {
    const cat = this.categoryRepo.create({
      name: dto.name,
      slug: dto.slug,
      icon: dto.icon,
      orderNum: dto.orderNum ?? 0,
      status: dto.status ?? 1,
      description: dto.description,
    });

    if (dto.parentId && dto.parentId > 0) {
      const parent = await this.categoryRepo.findOneBy({ id: dto.parentId });
      if (!parent) {
        throw new BadRequestException('父级分类不存在');
      }
      cat.parent = parent;
    }

    return await this.categoryTreeRepo.save(cat);
  }

  // 6. 更新分类
  async update(id: number, dto: UpdateCategoryDto): Promise<CategoryEntity> {
    const cat = await this.findOne(id);

    if (dto.parentId !== undefined && dto.parentId === id) {
      throw new BadRequestException('上级分类不能为当前分类自身');
    }

    if (dto.parentId !== undefined && dto.parentId > 0) {
      const subIds = await this.getSubCategoryIds(id);
      if (subIds.includes(dto.parentId)) {
        throw new BadRequestException('上级分类不能为当前分类的子分类');
      }
      const parent = await this.categoryRepo.findOneBy({ id: dto.parentId });
      if (!parent) {
        throw new BadRequestException('父级分类不存在');
      }
      cat.parent = parent;
    } else if (dto.parentId === 0) {
      cat.parent = null as any;
    }

    Object.assign(cat, {
      name: dto.name ?? cat.name,
      slug: dto.slug ?? cat.slug,
      icon: dto.icon ?? cat.icon,
      orderNum: dto.orderNum ?? cat.orderNum,
      status: dto.status ?? cat.status,
      description: dto.description ?? cat.description,
    });

    return await this.categoryTreeRepo.save(cat);
  }

  // 7. 删除分类 (包含级联安全检查)
  async remove(id: number): Promise<void> {
    const subIds = await this.getSubCategoryIds(id);
    if (subIds.length > 1) {
      throw new BadRequestException('该分类下存在子分类，请先处理子分类');
    }

    // 检查是否有文章绑定在此分类下
    const [articleCount] = await this.dataSource.query(
      'SELECT COUNT(*) as count FROM art_article WHERE category_id = ? AND deleted_at IS NULL',
      [id],
    );
    if (articleCount && parseInt(articleCount.count, 10) > 0) {
      throw new BadRequestException(`该分类下存在 ${articleCount.count} 篇文章，请先迁移或删除相关文章`);
    }

    await this.categoryRepo.softDelete(id);
  }
}
