import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { OperLogEntity } from './entities/oper-log.entity';
import { QueryOperLogDto } from './dto/query-oper-log.dto';

@Injectable()
export class OperLogService {
  constructor(
    @InjectRepository(OperLogEntity)
    private readonly operLogRepo: Repository<OperLogEntity>,
  ) {}

  async page(query: QueryOperLogDto) {
    const { pageNum = 1, pageSize = 10, title, operName, businessType, status } = query;
    const qb = this.operLogRepo.createQueryBuilder('log');

    if (title) {
      qb.andWhere('log.title LIKE :title', { title: `%${title}%` });
    }
    if (operName) {
      qb.andWhere('log.oper_name LIKE :operName', { operName: `%${operName}%` });
    }
    if (businessType !== undefined && businessType !== null) {
      qb.andWhere('log.business_type = :businessType', { businessType });
    }
    if (status !== undefined && status !== null) {
      qb.andWhere('log.status = :status', { status });
    }

    qb.orderBy('log.id', 'DESC')
      .skip((pageNum - 1) * pageSize)
      .take(pageSize);

    const [rows, total] = await qb.getManyAndCount();
    return { rows, total };
  }

  async findOne(id: number) {
    const log = await this.operLogRepo.findOneBy({ id });
    if (!log) throw new NotFoundException('日志记录不存在');
    return log;
  }

  async remove(ids: number[]) {
    await this.operLogRepo.delete({ id: In(ids) });
    return { message: '删除成功' };
  }

  async clean() {
    await this.operLogRepo.clear();
    return { message: '清空成功' };
  }
}
