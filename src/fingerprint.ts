/**
 * 客户端免 JS 被动指纹与 ETag 状态追踪模块
 * 采用 16 位十六进制（64-bit 熵空间）SHA-256 哈希，彻底规避短哈希的生日悖论碰撞问题。
 */

/**
 * 将输入字符串计算为 16 位小写十六进制 SHA-256 哈希
 */
export async function compute16HexHash(input: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(input));
  const arr = Array.from(new Uint8Array(buf));
  // 64-bit (8 bytes = 16 hex chars)
  return arr
    .slice(0, 8)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * 提取客户端被动 HTTP 特征（无 JS 环境下的环境熵）
 */
export function extractClientFactors(request: Request): string {
  const userAgent = request.headers.get("user-agent") || "";
  const accept = request.headers.get("accept") || "";
  const acceptLanguage = request.headers.get("accept-language") || "";
  const acceptEncoding = request.headers.get("accept-encoding") || "";
  const secChUa = request.headers.get("sec-ch-ua") || "";
  const secChUaPlatform = request.headers.get("sec-ch-ua-platform") || "";
  const secChUaMobile = request.headers.get("sec-ch-ua-mobile") || "";

  // Cloudflare 边缘环境特征
  const httpProtocol = (request.cf?.httpProtocol as string) || "";
  const tlsVersion = (request.cf?.tlsVersion as string) || "";
  const tlsCipher = (request.cf?.tlsCipher as string) || "";

  return [
    userAgent,
    accept,
    acceptLanguage,
    acceptEncoding,
    secChUa,
    secChUaPlatform,
    secChUaMobile,
    httpProtocol,
    tlsVersion,
    tlsCipher
  ].join("||");
}

export interface ResolvedFingerprint {
  deviceFp: string; // 16 位核心设备标识（形如 dev_7f8a9b0c1234abcd）
  clientFp: string; // 16 位环境特征哈希（形如 env_a1b2c3d4e5f67890）
  isRepeat: boolean; // 是否成功通过 ETag 继承了该设备先前的标识
}

/**
 * 从 If-None-Match 请求头中安全提取 16 位设备指纹 dev_<16hex>
 * 兼容 W/ 弱标记、双引号、多 ETag 逗号列表等规范格式
 */
export function extractDeviceFpFromIfNoneMatch(ifNoneMatchHeader: string | null): string | null {
  if (!ifNoneMatchHeader) return null;
  const match = ifNoneMatchHeader.match(/dev_[0-9a-f]{16}/i);
  return match ? match[0].toLowerCase() : null;
}

/**
 * 解析并确定设备的最终指纹
 * 1. 优先校验客户端是否带回了 If-None-Match 中的 dev_<16hex> ETag 状态锁；
 * 2. 若未带回（首次访问，或客户端未携带缓存）：
 *    基于 (客户端环境特征 clientFp + 客户端 IP) 计算确定性的设备基础哈希。
 *    杜绝随机数/时间戳漂移，确保同一台设备连按 F5 时计算出的指纹 100% 绝对稳定！
 */
export async function resolveDeviceFingerprint(
  request: Request,
  probeId: string
): Promise<ResolvedFingerprint> {
  const factors = extractClientFactors(request);
  const clientHash = await compute16HexHash(factors);
  const clientFp = `env_${clientHash}`;

  const ip = request.headers.get("cf-connecting-ip") || "127.0.0.1";

  // 1. 优先检查客户端是否回传了既有设备指纹
  const rawIfNoneMatch = request.headers.get("if-none-match");
  const extractedFp = extractDeviceFpFromIfNoneMatch(rawIfNoneMatch);

  if (extractedFp) {
    return {
      deviceFp: extractedFp,
      clientFp,
      isRepeat: true
    };
  }

  // 2. 首次访问或未携带 ETag：计算确定性的基础设备指纹
  // 采用 clientFp (UA+Accept+Sec-CH-UA+协议特征) 结合 IP，
  // 确保同 IP 同浏览器在任何情况下都不会生成飘移的假指纹
  const baseSeed = `${clientFp}||${ip}`;
  const deviceHash = await compute16HexHash(baseSeed);
  const deviceFp = `dev_${deviceHash}`;

  return {
    deviceFp,
    clientFp,
    isRepeat: false
  };
}
