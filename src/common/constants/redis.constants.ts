export const REDIS_KEYS = {
  // 验证码: admin:captcha:{uuid}
  CAPTCHA_CODE_KEY: 'admin:captcha:',
  // 登录 Token 白名单 / 刷新 Token: admin:token:{userId}
  ACCESS_TOKEN_KEY: 'admin:token:access:',
  REFRESH_TOKEN_KEY: 'admin:token:refresh:',
  // 参数配置缓存: admin:config:{configKey}
  SYS_CONFIG_KEY: 'admin:config:',
  // 数据字典缓存: admin:dict:{dictType}
  SYS_DICT_KEY: 'admin:dict:',
  // 密码错误重试防爆破计数: admin:login_fail:{username}
  LOGIN_FAIL_KEY: 'admin:login_fail:',
};
