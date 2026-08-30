import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as os from 'os';
import * as fs from 'fs';
import { UserEntity } from '../system/user/entities/user.entity';
import { OperLogEntity } from '../system/log/entities/oper-log.entity';
import { RedisService } from '../../database/redis.service';

export interface RedisMetrics {
  connected: boolean;
  keys: number;
  hitRate: number;
}

export interface DiskMetrics {
  total: number;
  used: number;
  free: number;
  usage: number;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  private lastCpuTimes: { idle: number; total: number } | null = null;
  private lastCpuUsage = 0;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(OperLogEntity)
    private readonly operLogRepo: Repository<OperLogEntity>,
    private readonly redisService: RedisService,
  ) {
    this.calculateCpuUsage();
  }

  private calculateCpuUsage(): number {
    const cpus = os.cpus();
    if (!cpus || cpus.length === 0) return 0;

    let idle = 0;
    let total = 0;
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        total += (cpu.times as any)[type];
      }
      idle += cpu.times.idle;
    }

    if (this.lastCpuTimes) {
      const idleDiff = idle - this.lastCpuTimes.idle;
      const totalDiff = total - this.lastCpuTimes.total;
      if (totalDiff > 0) {
        const usage = 100 - (idleDiff / totalDiff) * 100;
        this.lastCpuUsage = Math.min(
          100,
          Math.max(0, Math.round(usage * 10) / 10),
        );
      }
    } else {
      if (process.platform !== 'win32') {
        const load = os.loadavg()[0];
        const cpuCount = cpus.length || 1;
        this.lastCpuUsage = Math.min(
          100,
          Math.max(0, Math.round((load / cpuCount) * 1000) / 10),
        );
      } else {
        const usage = total > 0 ? 100 - (idle / total) * 100 : 0;
        this.lastCpuUsage = Math.min(
          100,
          Math.max(0, Math.round(usage * 10) / 10),
        );
      }
    }

    this.lastCpuTimes = { idle, total };
    return this.lastCpuUsage;
  }

  private getDiskMetrics(): DiskMetrics | null {
    // 本地开发环境（Windows）不采集与展示个人电脑硬盘，仅在服务器生产环境（Linux 等）采集真实磁盘存储
    if (process.platform === 'win32') {
      return null;
    }

    try {
      if (typeof fs.statfsSync === 'function') {
        const rootPath = '/';
        const stats = fs.statfsSync(rootPath);
        const bsize = stats.bsize || 4096;
        const total = Number(stats.blocks || 0) * bsize;
        const free = Number(stats.bavail || stats.bfree || 0) * bsize;
        const used = Math.max(total - free, 0);
        const usage =
          total > 0
            ? Math.min(
                100,
                Math.max(
                  0,
                  Math.round((used / total) * 1000) / 10,
                ),
              )
            : 0;
        return { total, used, free, usage };
      }
    } catch (error) {
      this.logger.warn(
        `Unable to read disk metrics: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    return null;
  }

  private getRuntimeMetrics(redis: RedisMetrics) {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = Math.max(totalMemory - freeMemory, 0);
    const cpuCount = os.cpus().length || 1;
    const cpuUsage = this.calculateCpuUsage();
    const disk = this.getDiskMetrics();

    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: Math.round(process.uptime()),
      cpuUsage,
      cpuCores: cpuCount,
      memoryUsage: Math.round((usedMemory / totalMemory) * 1000) / 10,
      memoryUsed: usedMemory,
      memoryTotal: totalMemory,
      disk,
      redis,
    };
  }

  async getOverview(days: number) {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const rangeStart = new Date(todayStart);
    rangeStart.setDate(rangeStart.getDate() - (days - 1));

    const [
      userCount,
      auditLogCount,
      todayCalls,
      successCount,
      trend,
      recentActivities,
      redis,
    ] = await Promise.all([
      this.userRepo.count(),
      this.operLogRepo.count(),
      this.operLogRepo
        .createQueryBuilder('log')
        .where('log.oper_time >= :todayStart', { todayStart })
        .getCount(),
      this.operLogRepo
        .createQueryBuilder('log')
        .where('log.oper_time >= :todayStart', { todayStart })
        .andWhere('log.status = :status', { status: 1 })
        .getCount(),
      this.getTrend(rangeStart, days),
      this.getRecentActivities(),
      this.getRedisMetrics(),
    ]);

    const runtime = this.getRuntimeMetrics(redis);
    return {
      metrics: {
        userCount,
        todayCalls,
        auditLogCount,
        successRate: todayCalls
          ? Math.round((successCount / todayCalls) * 1000) / 10
          : 100,
      },
      trend,
      recentActivities,
      runtime,
      generatedAt: now.toISOString(),
    };
  }

  private async getTrend(start: Date, days: number) {
    const rows = await this.operLogRepo
      .createQueryBuilder('log')
      .select('DATE(log.oper_time)', 'day')
      .addSelect('COUNT(*)', 'total')
      .where('log.oper_time >= :start', { start })
      .groupBy('DATE(log.oper_time)')
      .orderBy('day', 'ASC')
      .getRawMany<{ day: string; total: string }>();

    const values = new Map(
      rows.map((row) => [this.toDayKey(row.day), Number(row.total)]),
    );
    const labels: string[] = [];
    const counts: number[] = [];
    for (let index = 0; index < days; index += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      const key = this.toDayKey(day);
      labels.push(key);
      counts.push(values.get(key) || 0);
    }

    return { labels, apiRequests: counts, auditLogs: counts };
  }

  private async getRecentActivities() {
    const rows = await this.operLogRepo.find({
      order: { id: 'DESC' },
      take: 6,
    });
    return rows.map((log) => ({
      id: Number(log.id),
      operator: log.operName || '匿名用户',
      time: log.operTime.toISOString(),
      action: log.title || log.requestMethod || '系统操作',
      target: log.operUrl || '--',
      status: log.status,
    }));
  }

  private async getRedisMetrics(): Promise<RedisMetrics> {
    try {
      const client = this.redisService.getClient();
      if (client.status !== 'ready') {
        return { connected: false, keys: 0, hitRate: 0 };
      }
      const [keyCount, info] = await Promise.all([
        client.dbsize(),
        client.info('stats'),
      ]);
      const hits = this.readRedisInfoNumber(info, 'keyspace_hits');
      const misses = this.readRedisInfoNumber(info, 'keyspace_misses');
      const hitRate =
        hits + misses > 0
          ? Math.round((hits / (hits + misses)) * 1000) / 10
          : 0;
      return { connected: true, keys: keyCount, hitRate };
    } catch (error) {
      this.logger.warn(
        `Unable to read Redis metrics: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { connected: false, keys: 0, hitRate: 0 };
    }
  }


  private readRedisInfoNumber(info: string, key: string) {
    const line = info.split('\n').find((item) => item.startsWith(`${key}:`));
    return line ? Number(line.slice(key.length + 1)) || 0 : 0;
  }

  private toDayKey(value: string | Date) {
    if (typeof value === 'string') return value.slice(0, 10);
    const day = value instanceof Date ? value : new Date(value);
    return day.toISOString().slice(0, 10);
  }
}
