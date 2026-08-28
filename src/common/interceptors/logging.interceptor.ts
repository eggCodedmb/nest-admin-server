import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperLogEntity } from '../../modules/system/log/entities/oper-log.entity';
import { OPER_LOG_KEY, LogOptions } from '../decorators/log.decorator';
import { getClientIp } from '../utils/ip.util';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    @InjectRepository(OperLogEntity)
    private operLogRepo: Repository<OperLogEntity>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const logOptions = this.reflector.get<LogOptions>(OPER_LOG_KEY, context.getHandler());
    if (!logOptions) return next.handle();

    const start = Date.now();
    const req = context.switchToHttp().getRequest();
    const user = req.user || {};

    return next.handle().pipe(
      tap({
        next: (data) => {
          this.saveLog(req, user, logOptions, data, 1, null, Date.now() - start);
        },
        error: (err) => {
          this.saveLog(req, user, logOptions, null, 0, err.message, Date.now() - start);
        },
      }),
    );
  }

  private async saveLog(
    req: any,
    user: any,
    opt: LogOptions,
    result: any,
    status: number,
    err: string | null,
    costTime: number,
  ) {
    try {
      const clientIp = getClientIp(req);

      // 过滤大请求体或敏感字段
      let operParam = null;
      if (opt.isSaveRequestData !== false && req.body) {
        const bodyCopy = { ...req.body };
        if (bodyCopy.password) bodyCopy.password = '******';
        operParam = bodyCopy;
      }

      let jsonResult = null;
      if (opt.isSaveResponseData !== false && result) {
        jsonResult = result;
      }

      const log = this.operLogRepo.create({
        title: opt.title,
        businessType: opt.businessType || 0,
        method: req.route?.path || req.url || '',
        requestMethod: req.method,
        operUserId: user.userId || null,
        operName: user.username || '匿名用户',
        deptName: user.deptName || '',
        operUrl: req.originalUrl || req.url,
        operIp: clientIp,
        operLocation: '',
        operParam,
        jsonResult,
        status,
        errorMsg: err,
        costTime,
      });

      // 异步持久化入库，不阻塞业务主响应
      this.operLogRepo.save(log).catch(() => null);
    } catch {
      // 忽略日志异常
    }
  }
}
