import { SelectQueryBuilder } from 'typeorm';
import { DataScopeType } from '../constants/system.constants';
import { DeptService } from '../../modules/system/dept/dept.service';

export async function applyDataScope<T>(
  qb: SelectQueryBuilder<T>,
  currentUser: any,
  deptService: DeptService,
  deptAlias = 'dept',
  userAlias = 'user',
): Promise<SelectQueryBuilder<T>> {
  if (!currentUser || !currentUser.roles || !Array.isArray(currentUser.roles)) {
    return qb;
  }
  if (currentUser.roles.some((r: any) => r.roleKey === 'admin') || currentUser.userId === 1) {
    return qb; // 超管不过滤
  }

  const orConditions: string[] = [];
  const params: Record<string, any> = {};

  for (const role of currentUser.roles) {
    switch (Number(role.dataScope)) {
      case DataScopeType.ALL:
        return qb;
      case DataScopeType.DEPT_AND_CHILD: {
        if (currentUser.deptId) {
          const ids = await deptService.getSubDeptIds(currentUser.deptId);
          orConditions.push(`${deptAlias}.id IN (:...scopeDeptIds_${role.id})`);
          params[`scopeDeptIds_${role.id}`] = ids.length ? ids : [0];
        } else {
          orConditions.push('1=0');
        }
        break;
      }
      case DataScopeType.DEPT_ONLY:
        orConditions.push(`${deptAlias}.id = :scopeUserDeptId_${role.id}`);
        params[`scopeUserDeptId_${role.id}`] = currentUser.deptId || 0;
        break;
      case DataScopeType.SELF:
        orConditions.push(`${userAlias}.id = :scopeUserId_${role.id}`);
        params[`scopeUserId_${role.id}`] = currentUser.userId;
        break;
      case DataScopeType.CUSTOM:
        orConditions.push(
          `${deptAlias}.id IN (SELECT dept_id FROM sys_role_dept WHERE role_id = :scopeRoleId_${role.id})`,
        );
        params[`scopeRoleId_${role.id}`] = role.id;
        break;
    }
  }

  if (orConditions.length > 0) {
    qb.andWhere(`(${orConditions.join(' OR ')})`, params);
  }
  return qb;
}
