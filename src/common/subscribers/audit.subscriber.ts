import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent } from 'typeorm';
import { ClsServiceManager } from 'nestjs-cls';
import { Injectable } from '@nestjs/common';
import { BaseEntity } from '../entities/base.entity';

@Injectable()
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface<BaseEntity> {
  listenTo() {
    return BaseEntity;
  }

  beforeInsert(event: InsertEvent<BaseEntity>) {
    try {
      const cls = ClsServiceManager.getClsService();
      const userId = cls?.get<number>('userId');
      if (userId && event.entity) {
        event.entity.createdBy = userId;
        event.entity.updatedBy = userId;
      }
    } catch {
      // 忽略非 HTTP 请求上下文中的获取异常
    }
  }

  beforeUpdate(event: UpdateEvent<BaseEntity>) {
    try {
      const cls = ClsServiceManager.getClsService();
      const userId = cls?.get<number>('userId');
      if (userId && event.entity) {
        event.entity.updatedBy = userId;
      }
    } catch {
      // 忽略非 HTTP 请求上下文中的获取异常
    }
  }
}
