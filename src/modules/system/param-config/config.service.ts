import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigEntity } from './entities/config.entity';
import { CreateConfigDto, UpdateConfigDto } from './dto/create-config.dto';
import { QueryConfigDto } from './dto/query-config.dto';
import { RedisService } from '../../../database/redis.service';
import { REDIS_KEYS } from '../../../common/constants/redis.constants';

@Injectable()
export class ParamConfigService {
  constructor(
    @InjectRepository(ConfigEntity)
    private readonly configRepo: Repository<ConfigEntity>,
    private readonly redisService: RedisService,
  ) {}

  // 1. 分页查询参数配置
  async page(query: QueryConfigDto) {
    const { pageNum = 1, pageSize = 10, configName, configKey, configType } = query;
    const qb = this.configRepo.createQueryBuilder('config');

    if (configName) {
      qb.andWhere('config.config_name LIKE :configName', { configName: `%${configName}%` });
    }
    if (configKey) {
      qb.andWhere('config.config_key LIKE :configKey', { configKey: `%${configKey}%` });
    }
    if (configType !== undefined && configType !== null) {
      qb.andWhere('config.config_type = :configType', { configType });
    }

    qb.orderBy('config.id', 'DESC')
      .skip((pageNum - 1) * pageSize)
      .take(pageSize);

    const [rows, total] = await qb.getManyAndCount();
    return { rows, total };
  }

  // 2. 根据ID查询详情
  async findOne(id: number) {
    const config = await this.configRepo.findOneBy({ id });
    if (!config) throw new NotFoundException('配置项不存在');
    return config;
  }

  // 3. 根据参数键名获取参数值 (带 Redis 缓存)
  async getConfigValueByKey(configKey: string): Promise<string> {
    const cacheKey = `${REDIS_KEYS.SYS_CONFIG_KEY}${configKey}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached !== null) return cached;

    const config = await this.configRepo.findOneBy({ configKey });
    const val = config?.configValue ?? '';
    await this.redisService.set(cacheKey, val, 3600 * 24);
    return val;
  }

  // 4. 新增参数配置
  async create(dto: CreateConfigDto) {
    const exists = await this.configRepo.findOneBy({ configKey: dto.configKey });
    if (exists) throw new BadRequestException(`参数键名 ${dto.configKey} 已存在`);
    const entity = this.configRepo.create(dto);
    const saved = await this.configRepo.save(entity);
    await this.clearCache(dto.configKey);
    return saved;
  }

  // 5. 修改参数配置
  async update(id: number, dto: UpdateConfigDto) {
    const config = await this.findOne(id);
    const oldKey = config.configKey;

    if (dto.configKey && dto.configKey !== oldKey) {
      const exists = await this.configRepo.findOneBy({ configKey: dto.configKey });
      if (exists) throw new BadRequestException(`参数键名 ${dto.configKey} 已存在`);
    }

    const { id: _id, ...updatePayload } = dto;
    Object.assign(config, updatePayload);
    const saved = await this.configRepo.save(config);
    await this.clearCache(oldKey);
    if (saved.configKey !== oldKey) {
      await this.clearCache(saved.configKey);
    }
    return saved;
  }

  // 6. 删除参数配置
  async remove(id: number) {
    const config = await this.findOne(id);
    if (config.configType === 1) {
      throw new BadRequestException('系统内置参数不能删除');
    }
    await this.configRepo.delete(id);
    await this.clearCache(config.configKey);
    return { message: '删除成功' };
  }

  // 7. 清理缓存
  async clearCache(configKey?: string) {
    if (configKey) {
      await this.redisService.del(`${REDIS_KEYS.SYS_CONFIG_KEY}${configKey}`);
    } else {
      const keys = await this.redisService.keys(`${REDIS_KEYS.SYS_CONFIG_KEY}*`);
      if (keys.length > 0) {
        for (const k of keys) {
          await this.redisService.del(k);
        }
      }
    }
  }
}
