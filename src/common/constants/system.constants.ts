/**
 * 业务操作类型
 */
export enum BusinessType {
  OTHER = 0,
  INSERT = 1,
  UPDATE = 2,
  DELETE = 3,
  EXPORT = 4,
  IMPORT = 5,
  FORCE = 6,
  CLEAN = 7,
}

/**
 * 状态标识
 */
export enum CommonStatus {
  DISABLE = 0,
  ENABLE = 1,
}

/**
 * 数据权限范围
 */
export enum DataScopeType {
  ALL = 1, // 全部数据权限
  DEPT_AND_CHILD = 2, // 本部门及以下数据权限
  DEPT_ONLY = 3, // 仅本部门数据权限
  SELF = 4, // 仅本人数据权限
  CUSTOM = 5, // 自定义数据权限
}

/**
 * 菜单类型
 */
export enum MenuType {
  DIRECTORY = 'M', // 目录
  MENU = 'C', // 菜单
  BUTTON = 'F', // 按钮
}
