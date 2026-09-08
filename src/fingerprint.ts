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
 * 解析并确定设备的最终指纹
 * 1. 优先校验客户端是否带回了合法的 dev_<16hex> ETag 状态锁；
 * 2. 若未带回（首次访问），则基于探针ID、环境特征、随机盐与时间戳派发新的 16 位设备指纹。
 */
export async function resolveDeviceFingerprint(
  request: Request,
  probeId: string
): Promise<ResolvedFingerprint> {
  const factors = extractClientFactors(request);
  const clientHash = await compute16HexHash(factors);
  const clientFp = `env_${clientHash}`;

  // 检查客户端回传的 If-None-Match
  const rawIfNoneMatch = request.headers.get("if-none-match") || "";
  // 规整去引号及 W/ 弱验证符，匹配 dev_<16位hex>
  const cleanEtag = rawIfNoneMatch.replace(/^W\//, "").replace(/"/g, "").trim();

  const devFpRegex = /^dev_[0-9a-f]{16}$/i;
  if (cleanEtag && devFpRegex.test(cleanEtag)) {
    // 成功命中客户端缓存回传的既有设备指纹
    return {
      deviceFp: cleanEtag.toLowerCase(),
      clientFp,
      isRepeat: true
    };
  }

  // 首次访问或未携带合法标识：动态生成新的 16 位设备指纹
  const randomSalt = crypto.randomUUID();
  const seed = `${probeId}:${clientFp}:${randomSalt}:${Date.now()}`;
  const deviceHash = await compute16HexHash(seed);
  const deviceFp = `dev_${deviceHash}`;

  return {
    deviceFp,
    clientFp,
    isRepeat: false
  };
}
