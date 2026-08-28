import { Request } from 'express';

/**
 * 从 HTTP 请求中提取真实客户端 IP 地址
 *
 * 优先级:
 * 1. X-Real-IP (Nginx 常用)
 * 2. X-Forwarded-For 的第一个 IP（代理链最左端 = 原始客户端）
 * 3. req.ip (Express 在 trust proxy 开启时会自动解析)
 * 4. req.socket.remoteAddress
 * 5. 兜底 '127.0.0.1'
 *
 * 同时会去掉 IPv6-mapped IPv4 前缀 (::ffff:)
 */
export function getClientIp(req: Request): string {
  let ip: string | undefined;

  // 优先使用 X-Real-IP（通常由 Nginx proxy_set_header X-Real-IP $remote_addr 设置）
  const xRealIp = req.headers['x-real-ip'];
  if (xRealIp) {
    ip = Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
  }

  // 其次使用 X-Forwarded-For（取第一个，即最原始的客户端 IP）
  if (!ip) {
    const xff = req.headers['x-forwarded-for'];
    if (xff) {
      const raw = Array.isArray(xff) ? xff[0] : xff;
      ip = raw.split(',')[0].trim();
    }
  }

  // Express req.ip（在 trust proxy 开启后会自动解析代理头）
  if (!ip) {
    ip = req.ip;
  }

  // 最后回退到 socket 层
  if (!ip) {
    ip = req.socket?.remoteAddress;
  }

  // 兜底
  if (!ip) {
    return '127.0.0.1';
  }

  // 去掉 IPv6-mapped IPv4 前缀，例如 ::ffff:192.168.1.100 -> 192.168.1.100
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  // ::1 是 IPv6 环回地址，映射为 127.0.0.1 更易读
  if (ip === '::1') {
    return '127.0.0.1';
  }

  return ip;
}
