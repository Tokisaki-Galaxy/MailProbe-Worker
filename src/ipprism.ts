import { IpPrismResult } from "./types";

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

    return {
      success: true,
      location: location || undefined,
      country: country || undefined,
      region: region || undefined,
      city: city || undefined,
      isp: isp || undefined
    };
  } catch (err) {
    return { success: false };
  }
}
