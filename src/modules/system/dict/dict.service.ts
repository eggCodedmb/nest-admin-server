import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DictTypeEntity } from './entities/dict-type.entity';
import { DictDataEntity } from './entities/dict-data.entity';
import { CreateDictTypeDto, UpdateDictTypeDto } from './dto/create-dict-type.dto';
import { CreateDictDataDto, UpdateDictDataDto } from './dto/create-dict-data.dto';
import { QueryDictTypeDto, QueryDictDataDto } from './dto/query-dict.dto';
import { RedisService } from '../../../database/redis.service';
import { REDIS_KEYS } from '../../../common/constants/redis.constants';

@Injectable()
export class DictService {
  constructor(
    @InjectRepository(DictTypeEntity)
    private readonly dictTypeRepo: Repository<DictTypeEntity>,
    @InjectRepository(DictDataEntity)
    private readonly dictDataRepo: Repository<DictDataEntity>,
    private readonly redisService: RedisService,
  ) {}

  // ================= 字典类型管理 =================

  async pageType(query: QueryDictTypeDto) {
    const { pageNum = 1, pageSize = 10, dictName, dictType, status } = query;
    const qb = this.dictTypeRepo.createQueryBuilder('type');

    if (dictName) {
      qb.andWhere('type.dict_name LIKE :dictName', { dictName: `%${dictName}%` });
    }
    if (dictType) {
      qb.andWhere('type.dict_type LIKE :dictType', { dictType: `%${dictType}%` });
    }
    if (status !== undefined && status !== null) {
      qb.andWhere('type.status = :status', { status });
    }

    qb.orderBy('type.id', 'DESC')
      .skip((pageNum - 1) * pageSize)
      .take(pageSize);

    const [rows, total] = await qb.getManyAndCount();
    return { rows, total };
  }

  async findAllTypes() {
    return await this.dictTypeRepo.find({ where: { status: 1 } });
  }

  async findOneType(id: number) {
    const type = await this.dictTypeRepo.findOneBy({ id });
    if (!type) throw new NotFoundException('字典类型不存在');
    return type;
  }

  async createType(dto: CreateDictTypeDto) {
    const exists = await this.dictTypeRepo.findOneBy({ dictType: dto.dictType });
    if (exists) throw new BadRequestException(`字典类型 ${dto.dictType} 已存在`);
    const entity = this.dictTypeRepo.create(dto);
    return await this.dictTypeRepo.save(entity);
  }

  async updateType(id: number, dto: UpdateDictTypeDto) {
    const type = await this.findOneType(id);
    if (dto.dictType && dto.dictType !== type.dictType) {
      const exists = await this.dictTypeRepo.findOneBy({ dictType: dto.dictType });
      if (exists) throw new BadRequestException(`字典类型 ${dto.dictType} 已存在`);
      // 同步更新 dict_data 中的 dict_type
      await this.dictDataRepo.update({ dictType: type.dictType }, { dictType: dto.dictType });
      await this.clearCache(type.dictType);
    }
    const { id: _id, ...updatePayload } = dto;
    Object.assign(type, updatePayload);
    const updated = await this.dictTypeRepo.save(type);
    await this.clearCache(updated.dictType);
    return updated;
  }

  async removeType(id: number) {
    const type = await this.findOneType(id);
    const count = await this.dictDataRepo.count({ where: { dictType: type.dictType } });
    if (count > 0) throw new BadRequestException('该字典类型下已分配字典数据，不能删除');
    await this.dictTypeRepo.delete(id);
    await this.clearCache(type.dictType);
    return { message: '删除成功' };
  }

  // ================= 字典数据管理 =================

  async pageData(query: QueryDictDataDto) {
    const { pageNum = 1, pageSize = 10, dictType, dictLabel, status } = query;
    const qb = this.dictDataRepo.createQueryBuilder('data');

    if (dictType) {
      qb.andWhere('data.dict_type = :dictType', { dictType });
    }
    if (dictLabel) {
      qb.andWhere('data.dict_label LIKE :dictLabel', { dictLabel: `%${dictLabel}%` });
    }
    if (status !== undefined && status !== null) {
      qb.andWhere('data.status = :status', { status });
    }

    qb.orderBy('data.dict_sort', 'ASC')
      .skip((pageNum - 1) * pageSize)
      .take(pageSize);

    const [rows, total] = await qb.getManyAndCount();
    return { rows, total };
  }

  async findOneData(id: number) {
    const data = await this.dictDataRepo.findOneBy({ id });
    if (!data) throw new NotFoundException('字典数据不存在');
    return data;
  }

  async createData(dto: CreateDictDataDto) {
    const entity = this.dictDataRepo.create(dto);
    const saved = await this.dictDataRepo.save(entity);
    await this.clearCache(dto.dictType);
    return saved;
  }

  async updateData(id: number, dto: UpdateDictDataDto) {
    const data = await this.findOneData(id);
    const oldType = data.dictType;
    const { id: _id, ...updatePayload } = dto;
    Object.assign(data, updatePayload);
    const saved = await this.dictDataRepo.save(data);
    await this.clearCache(oldType);
    if (saved.dictType !== oldType) {
      await this.clearCache(saved.dictType);
    }
    return saved;
  }

  async removeData(id: number) {
    const data = await this.findOneData(id);
    await this.dictDataRepo.delete(id);
    await this.clearCache(data.dictType);
    return { message: '删除成功' };
  }

  // 根据字典类型获取数据 (含 Redis 缓存)
  async getDictDataByType(dictType: string): Promise<DictDataEntity[]> {
    const cacheKey = `${REDIS_KEYS.SYS_DICT_KEY}${dictType}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore JSON parse error
      }
    }

    const data = await this.dictDataRepo.find({
      where: { dictType, status: 1 },
      order: { dictSort: 'ASC' },
    });

    await this.redisService.set(cacheKey, JSON.stringify(data), 3600 * 24); // 缓存24小时
    return data;
  }

  // 清除缓存
  async clearCache(dictType?: string) {
    if (dictType) {
      await this.redisService.del(`${REDIS_KEYS.SYS_DICT_KEY}${dictType}`);
    } else {
      const keys = await this.redisService.keys(`${REDIS_KEYS.SYS_DICT_KEY}*`);
      if (keys.length > 0) {
        for (const k of keys) {
          await this.redisService.del(k);
        }
      }
    }
  }
}
