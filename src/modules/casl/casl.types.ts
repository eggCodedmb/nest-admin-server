import { InferSubjects, MongoAbility } from '@casl/ability';
import { UserEntity } from '../system/user/entities/user.entity';
import { RoleEntity } from '../system/role/entities/role.entity';
import { MenuEntity } from '../system/menu/entities/menu.entity';
import { DeptEntity } from '../system/dept/entities/dept.entity';
import { DictTypeEntity } from '../system/dict/entities/dict-type.entity';
import { DictDataEntity } from '../system/dict/entities/dict-data.entity';
import { ConfigEntity } from '../system/param-config/entities/config.entity';
import { OperLogEntity } from '../system/log/entities/oper-log.entity';
import { CategoryEntity } from '../article/category/entities/category.entity';
import { ArticleEntity } from '../article/post/entities/article.entity';
import { AuditLogEntity } from '../article/audit/entities/audit-log.entity';

export enum Action {
  Manage = 'manage', // 通配符：代表所有操作
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  Export = 'export',
  Import = 'import',
}

// 收集所有被授权实体，'all' 表示通配所有实体
export type Subjects =
  | InferSubjects<
      | typeof UserEntity
      | typeof RoleEntity
      | typeof MenuEntity
      | typeof DeptEntity
      | typeof DictTypeEntity
      | typeof DictDataEntity
      | typeof ConfigEntity
      | typeof OperLogEntity
      | typeof CategoryEntity
      | typeof ArticleEntity
      | typeof AuditLogEntity
    >
  | 'all';

export type AppAbility = MongoAbility<[Action, Subjects]>;
