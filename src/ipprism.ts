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
function formatProviderName(rawKey: string): string {
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

  // 1. 如果有 sources 数组
  if (Array.isArray(data.sources)) {
    for (const item of data.sources) {
      const name = formatProviderName(item.name || item.source || "");
      const loc = item.location || [item.country, item.region, item.city].filter(Boolean).join(" · ");
      if (loc) {
        list.push({
          name,
          location: loc,
          isp: item.isp || (item.asn ? `AS${item.asn}` : undefined)
        });
      }
    }
  }

  // 2. 如果有 providers 字典对象（如 { amap: { country, region, city, isp } }）
  if (data.providers && typeof data.providers === "object" && !Array.isArray(data.providers)) {
    for (const [pKey, pVal] of Object.entries(data.providers)) {
      if (!pVal || typeof pVal !== "object") continue;
      const name = formatProviderName(pVal.name || pKey);
      const loc = pVal.location || [pVal.country, pVal.region, pVal.city].filter(Boolean).join(" · ");
      if (loc) {
        list.push({
          name,
          location: loc,
          isp: pVal.isp || (pVal.asn ? `AS${pVal.asn}` : undefined)
        });
      }
    }
  }

  return list;
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

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2秒超时快速保护

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
      return { success: false };
    }

    const data = (await res.json()) as IpPrismResult;
    const country = data.best?.country?.value || "";
    const region = data.best?.region?.value || "";
    const city = data.best?.city?.value || "";
    const isp = data.best?.isp?.value || "";
    const location = data.summary || [country, region, city].filter(Boolean).join(" · ");
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
    return { success: false };
  }
}
