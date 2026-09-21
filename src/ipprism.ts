import { IpPrismResult, IpProviderRecord } from "./types";

/**
 * 判断是否为私有、回环或保留 IP 地址
 */
export function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") return true;

  // IPv4 私网段
  if (
    /^10\./.test(ip) ||
    /^192\.168\./.test(ip) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) ||
    /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./.test(ip) // CGNAT
  ) {
    return true;
  }

  return false;
}

/**
 * 格式化提取子源 provider 名称
 */
export function formatProviderName(rawKey: string): string {
  const map: Record<string, string> = {
    amap: "高德开放平台",
    cz88: "纯真 CZ88",
    ipinfo: "IPInfo",
    geolite: "MaxMind GeoLite2",
    cloudflare: "Cloudflare 边缘",
    bilibili: "哔哩哔哩",
    pconline: "太平洋电脑网",
    ip2region: "ip2region",
    ipapi: "IP-API"
  };
  const lower = (rawKey || "").toLowerCase();
  return map[lower] || rawKey || "未知数据源";
}

/**
 * 健壮地从各种可能的数据结构中解析并提取轻量级 Provider 列表
 */
export function extractProvidersFromPrism(data: IpPrismResult): IpProviderRecord[] {
  const list: IpProviderRecord[] = [];

  const handleItem = (sourceKey: string, item: any) => {
    if (!item || typeof item !== "object") return;
    if (item.ok === false) return;

    const name = formatProviderName(item.name || item.source || sourceKey);

    // 格式化地域信息
    let loc = "";
    if (item.location) {
      loc = String(item.location).trim();
    } else if (item.region && typeof item.region === "string" && item.region.includes("–")) {
      // 兼容 cz88 格式："中国–江苏–南京" 或 "美国–华盛顿州–金–西雅图"
      loc = item.region.replace(/^[^\w\u4e00-\u9fa5]+|[^\w\u4e00-\u9fa5]+$/g, "").replace(/–/g, " · ");
    } else {
      const parts = [item.country, item.region, item.city].filter(Boolean);
      loc = parts.join(" · ");
    }

    // 提取运营商/组织
    const isp = item.isp || item.org || (item.asn ? (String(item.asn).startsWith("AS") ? String(item.asn) : `AS${item.asn}`) : undefined);

    if (loc) {
      list.push({
        name,
        location: loc,
        isp
      });
    }
  };

  // 1. 如果 sources 是数组
  if (Array.isArray(data.sources)) {
    for (const item of data.sources) {
      handleItem(item.source || item.name || "", item);
    }
  } else if (data.sources && typeof data.sources === "object") {
    // 2. 真实线上 ip-prism 结构：sources 为字典对象
    for (const [sKey, sVal] of Object.entries(data.sources)) {
      handleItem(sKey, sVal);
    }
  }

  // 3. 兼容额外 providers 字典对象
  if (data.providers && typeof data.providers === "object" && !Array.isArray(data.providers)) {
    for (const [pKey, pVal] of Object.entries(data.providers)) {
      handleItem(pKey, pVal);
    }
  }

  return list;
}

/**
 * 数据源可信度优先级（高精度国内源优先）
 */
const PROVIDER_PRIORITY: Record<string, number> = {
  "高德开放平台": 100,
  "纯真 CZ88": 90,
  "ip2region": 80,
  "太平洋电脑网": 70,
  "哔哩哔哩": 60,
  "IPInfo": 50,
  "IP-API": 40,
  "MaxMind GeoLite2": 30,
  "Cloudflare 边缘": 10
};

/**
 * 智能裁决并格式化位置与多源对比信息
 */
export function resolveLocationDetails(
  providers: IpProviderRecord[],
  fallbackLocation?: string,
  fallbackIsp?: string
): {
  primaryLocation: string;
  primaryProvider: string;
  primaryIsp?: string;
  compactComparison?: string;
} {
  if (!providers || providers.length === 0) {
    return {
      primaryLocation: fallbackLocation || "未知位置",
      primaryProvider: "Cloudflare 边缘",
      primaryIsp: fallbackIsp
    };
  }

  // 按权威度排序
  const sorted = [...providers].sort((a, b) => {
    const prioA = PROVIDER_PRIORITY[a.name] || 20;
    const prioB = PROVIDER_PRIORITY[b.name] || 20;
    return prioB - prioA;
  });

  const best = sorted[0];
  const primaryLocation = best.location || fallbackLocation || "未知位置";
  const primaryProvider = best.name;
  const primaryIsp = best.isp || fallbackIsp;

  // 生成紧凑对比单行摘要（排除掉与最佳源完全同名的数据）
  const others = sorted.slice(1);
  if (others.length === 0) {
    return {
      primaryLocation,
      primaryProvider,
      primaryIsp
    };
  }

  // 紧凑展示其他源：如 "纯真: 江苏省南京市 · 边缘: 中国 · 江苏 · 南京"
  const compItems = others.slice(0, 2).map(p => {
    // 缩短常用名称以适合即时通讯单行呈现
    const shortName = p.name
      .replace("开放平台", "")
      .replace("地图", "")
      .replace("Cloudflare ", "")
      .replace(" CZ88", "")
      .replace(" IP", "")
      .trim();
    return `${shortName}: ${p.location}`;
  });

  return {
    primaryLocation,
    primaryProvider,
    primaryIsp,
    compactComparison: compItems.join(" · ")
  };
}

/**
 * 调用自建 ip-prism 多源高精度 IP 定位服务
 */
export async function lookupIpWithPrism(
  baseUrl: string,
  apiKey: string,
  ip: string
): Promise<{
  success: boolean;
  location?: string;
  country?: string;
  region?: string;
  city?: string;
  isp?: string;
  providers?: IpProviderRecord[];
}> {
  if (!baseUrl || !apiKey || isPrivateIp(ip)) {
    return { success: false };
  }

  const cleanBase = baseUrl.replace(/\/+$/, "");
  const targetUrl = `${cleanBase}/v1/lookup?ip=${encodeURIComponent(ip)}`;

  // 增加自动重试 1 次（最多请求 2 次），超时放宽至 4000ms（在 waitUntil 异步后台无感执行）
  const maxAttempts = 2;
  const timeoutMs = 4000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
          "User-Agent": "MailProbe-Worker/1.0"
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 200));
          continue;
        }
        return { success: false };
      }

      const data = (await res.json()) as IpPrismResult;
      const country = data.best?.country?.value || "";
      const region = data.best?.region?.value || "";
      const city = data.best?.city?.value || "";
      const isp = data.best?.isp?.value || "";
      const bestLoc = [country, region, city].filter(Boolean).join(" · ");
      const location = bestLoc || data.summary || "";
      const providers = extractProvidersFromPrism(data);

      return {
        success: true,
        location: location || undefined,
        country: country || undefined,
        region: region || undefined,
        city: city || undefined,
        isp: isp || undefined,
        providers: providers.length > 0 ? providers : undefined
      };
    } catch (err) {
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, 200));
        continue;
      }
      return { success: false };
    }
  }

  return { success: false };
}
