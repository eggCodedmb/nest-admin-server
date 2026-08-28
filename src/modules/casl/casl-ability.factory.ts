import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Action, AppAbility } from './casl.types';
import { UserEntity } from '../system/user/entities/user.entity';
import { RoleEntity } from '../system/role/entities/role.entity';
import { DeptEntity } from '../system/dept/entities/dept.entity';
import { MenuEntity } from '../system/menu/entities/menu.entity';
import { DictTypeEntity } from '../system/dict/entities/dict-type.entity';
import { DictDataEntity } from '../system/dict/entities/dict-data.entity';
import { ConfigEntity } from '../system/param-config/entities/config.entity';
import { OperLogEntity } from '../system/log/entities/oper-log.entity';

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: any): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    // 1. 超级管理员 (admin) 拥有所有权限
    if (user.roles?.some((r: any) => r.roleKey === 'admin') || user.userId === 1) {
      can(Action.Manage, 'all');
      return build();
    }

    // 2. 将数据库权限标识 (如 sys:user:add, sys:dept:edit, sys:role:query) 映射为 CASL 规则
    const permissions: string[] = user.permissions || [];
    permissions.forEach((perm) => {
      // 兼容通配符
      if (perm === '*:*:*' || perm === '*:*') {
        can(Action.Manage, 'all');
        return;
      }

      const parts = perm.split(':');
      if (parts.length < 3) return;

      const [, target, op] = parts; // 例: sys:user:create
      let action = Action.Read;
      if (op === 'create' || op === 'add') action = Action.Create;
      else if (op === 'update' || op === 'edit') action = Action.Update;
      else if (op === 'delete' || op === 'remove') action = Action.Delete;
      else if (op === 'export') action = Action.Export;
      else if (op === 'import') action = Action.Import;
      else if (op === 'query' || op === 'list') action = Action.Read;

      if (target === 'user') can(action, UserEntity);
      else if (target === 'role') can(action, RoleEntity);
      else if (target === 'dept') can(action, DeptEntity);
      else if (target === 'menu') can(action, MenuEntity);
      else if (target === 'dict') {
        can(action, DictTypeEntity);
        can(action, DictDataEntity);
      } else if (target === 'config') can(action, ConfigEntity);
      else if (target === 'log') can(action, OperLogEntity);
    });

    // 3. 支持对象/属性级细粒度规则 (ABAC 示例：普通用户只能更新自己)
    if (user.userId) {
      can(Action.Update, UserEntity, { id: user.userId });
    }

    return build();
  }
}
