import { Env, ProbeMetadata, ProbeTriggerLog, StorageBackendType } from "./types";
import { parseUserAgent, sendDingTalkAlert } from "./dingtalk";
import { lookupIpWithPrism } from "./ipprism";
import { uploadToMjj } from "./storage/mjj";
import { uploadToR2 } from "./storage/r2";
import { renderHtml } from "./ui/index";

const TRANSPARENT_GIF_BASE64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const TRANSPARENT_GIF_BYTES = Uint8Array.from(atob(TRANSPARENT_GIF_BASE64), c => c.charCodeAt(0));

// ==========================================
// Probe 元数据 V8 内存微缓存 (TTL: 60s)
// 避免同机房多次探针请求反复查询底层 KV 存储
// ==========================================
interface MemoryCacheItem {
  data: ProbeMetadata | null;
  expiresAt: number;
}
const probeMemoryCache = new Map<string, MemoryCacheItem>();

function getProbeFromMemory(id: string): { hit: boolean; probe: ProbeMetadata | null } {
  const item = probeMemoryCache.get(id);
  if (item && item.expiresAt > Date.now()) {
    return { hit: true, probe: item.data };
  }
  if (item) {
    probeMemoryCache.delete(id);
  }
  return { hit: false, probe: null };
}

function setProbeToMemory(id: string, probe: ProbeMetadata | null, ttlSec = 60): void {
  // 控制内存容量，避免极端大量探针导致 Worker 内存泄漏
  if (probeMemoryCache.size > 2000) {
    const oldestKey = probeMemoryCache.keys().next().value;
    if (oldestKey) probeMemoryCache.delete(oldestKey);
  }
  probeMemoryCache.set(id, {
    data: probe,
    expiresAt: Date.now() + ttlSec * 1000
  });
}

function invalidateProbeMemory(id: string): void {
  probeMemoryCache.delete(id);
}

// 辅助管理探针索引
async function getProbeIndex(kv?: KVNamespace): Promise<string[]> {
  if (!kv) return [];
  const raw = await kv.get("index:probes");
  return raw ? JSON.parse(raw) : [];
}

async function addProbeToIndex(id: string, kv?: KVNamespace): Promise<void> {
  if (!kv) return;
  const ids = await getProbeIndex(kv);
  if (!ids.includes(id)) {
    ids.unshift(id);
    await kv.put("index:probes", JSON.stringify(ids.slice(0, 500)));
  }
}

async function removeProbeFromIndex(id: string, kv?: KVNamespace): Promise<void> {
  if (!kv) return;
  const ids = await getProbeIndex(kv);
  const filtered = ids.filter(item => item !== id);
  await kv.put("index:probes", JSON.stringify(filtered));
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 规整管理后台前缀，默认为 /admin
    const rawAdminPath = (env.ADMIN_PATH || "/admin").trim();
    const adminPrefix = rawAdminPath.startsWith("/") ? rawAdminPath : `/${rawAdminPath}`;

    // 1. 根路径重定向：访问根目录自动 302 跳转到管理后台 (受 Zero Trust 保护)
    if (pathname === "/" || pathname === "/index.html") {
      return Response.redirect(`${url.origin}${adminPrefix}`, 302);
    }

    // 2. 管理控制台 UI 页面 (/admin 或 /admin/)
    if (pathname === adminPrefix || pathname === `${adminPrefix}/` || pathname === `${adminPrefix}/index.html`) {
      const appTitle = env.APP_TITLE || "MailProbe 邮件探针";
      return new Response(renderHtml(appTitle, adminPrefix), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // 3. 获取当前环境支持的配置
    if ((pathname === `${adminPrefix}/api/config` || pathname === "/api/config") && request.method === "GET") {
      return Response.json({
        mjj: Boolean(env.MJJ_API_KEY && env.MJJ_API_KEY.trim().length > 0),
        r2: Boolean(env.MAILPROBE_R2),
        dingtalk: Boolean(env.DINGTALK_WEBHOOK && env.DINGTALK_SECRET),
        ipPrism: Boolean(env.IP_PRISM_URL && env.IP_PRISM_KEY),
        adminPrefix
      });
    }

    // 4. 上传图片并生成探针
    if ((pathname === `${adminPrefix}/api/upload` || pathname === "/api/upload") && request.method === "POST") {
      try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const note = (formData.get("note") as string) || "";
        const backend = (formData.get("backend") as StorageBackendType) || "mjj";

        if (!file || !(file instanceof File)) {
          return Response.json({ success: false, error: "未检测到有效的文件上传" }, { status: 400 });
        }

        const probeId = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
        let originUrl: string | undefined;
        let r2Key: string | undefined;

        if (backend === "mjj") {
          if (!env.MJJ_API_KEY) {
            return Response.json({ success: false, error: "未在环境变量中配置 MJJ_API_KEY" }, { status: 400 });
          }
          const mjjResult = await uploadToMjj(env.MJJ_API_KEY, file, file.name);
          if (!mjjResult.success || !mjjResult.url) {
            return Response.json({ success: false, error: mjjResult.error || "上传到 mjj.today 失败" }, { status: 500 });
          }
          originUrl = mjjResult.url;
        } else if (backend === "r2") {
          if (!env.MAILPROBE_R2) {
            return Response.json({ success: false, error: "未绑定 MAILPROBE_R2 存储桶" }, { status: 400 });
          }
          r2Key = `probes/${probeId}_${file.name}`;
          const r2Result = await uploadToR2(
            env.MAILPROBE_R2,
            r2Key,
            await file.arrayBuffer(),
            file.type || "image/png"
          );
          if (!r2Result.success) {
            return Response.json({ success: false, error: r2Result.error || "上传到 R2 失败" }, { status: 500 });
          }
        } else {
          return Response.json({ success: false, error: "未知的存储后端" }, { status: 400 });
        }

        const metadata: ProbeMetadata = {
          id: probeId,
          filename: file.name,
          note,
          backend,
          originUrl,
          r2Key,
          contentType: file.type || "image/png",
          createdAt: new Date().toISOString(),
          hits: 0
        };

        if (env.MAILPROBE_KV) {
          await env.MAILPROBE_KV.put(`probe:${probeId}`, JSON.stringify(metadata));
          await addProbeToIndex(probeId, env.MAILPROBE_KV);
        }

        const extMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
        const ext = extMatch ? extMatch[1].toLowerCase() : "png";
        // 关键：探针公开下载地址保持在根级别 /i/ 下，完全不受 Zero Trust 子目录保护拦截
        const probeUrl = `${url.origin}/i/${probeId}.${ext}`;

        return Response.json({
          success: true,
          probeId,
          probeUrl,
          filename: file.name,
          note,
          backend
        });
      } catch (err: any) {
        return Response.json({ success: false, error: err?.message || String(err) }, { status: 500 });
      }
    }

    // 5. 查询已创建的探针列表
    if ((pathname === `${adminPrefix}/api/probes` || pathname === "/api/probes") && request.method === "GET") {
      if (!env.MAILPROBE_KV) {
        return Response.json([]);
      }
      const ids = await getProbeIndex(env.MAILPROBE_KV);
      const probes: ProbeMetadata[] = [];

      for (const id of ids) {
        const raw = await env.MAILPROBE_KV.get(`probe:${id}`);
        if (raw) {
          try {
            probes.push(JSON.parse(raw));
          } catch (e) {}
        }
      }

      return Response.json(probes);
    }

    // 6. 删除探针接口（支持选择是否销毁 R2 源文件，非 R2 存储严格不删除源文件）
    const isDeleteProbe = (pathname.startsWith(`${adminPrefix}/api/probes/`) || pathname.startsWith("/api/probes/")) && request.method === "DELETE";
    if (isDeleteProbe) {
      const probeId = pathname.replace(`${adminPrefix}/api/probes/`, "").replace("/api/probes/", "").trim();
      if (!probeId) {
        return Response.json({ success: false, error: "探针 ID 不能为空" }, { status: 400 });
      }

      const deleteSource = url.searchParams.get("deleteSource") === "true";

      if (env.MAILPROBE_KV) {
        const raw = await env.MAILPROBE_KV.get(`probe:${probeId}`);
        if (raw) {
          try {
            const probe = JSON.parse(raw) as ProbeMetadata;

            // 严格约束：仅当存储后端是 R2，且用户勾选了 deleteSource 时，才调用 R2 销毁源文件
            if (deleteSource && probe.backend === "r2" && probe.r2Key && env.MAILPROBE_R2) {
              await env.MAILPROBE_R2.delete(probe.r2Key);
            }
          } catch (e) {
            console.error("处理探针源文件删除异常", e);
          }
        }

        await env.MAILPROBE_KV.delete(`probe:${probeId}`);
        await removeProbeFromIndex(probeId, env.MAILPROBE_KV);
        invalidateProbeMemory(probeId);
      }

      return Response.json({ success: true, probeId });
    }

    // 7. 获取探针触发历史记录
    if ((pathname === `${adminPrefix}/api/logs` || pathname === "/api/logs") && request.method === "GET") {
      if (!env.MAILPROBE_KV) {
        return Response.json([]);
      }
      const rawLogs = await env.MAILPROBE_KV.get("logs:recent");
      const logs: ProbeTriggerLog[] = rawLogs ? JSON.parse(rawLogs) : [];
      return Response.json(logs);
    }

    // 8. 清空探针触发历史记录
    if ((pathname === `${adminPrefix}/api/logs` || pathname === "/api/logs") && request.method === "DELETE") {
      if (env.MAILPROBE_KV) {
        await env.MAILPROBE_KV.delete("logs:recent");
      }
      return Response.json({ success: true });
    }

    // 8. 探针触发与图片反代下载入口 (路径格式: /i/:id 或 /i/:id.ext)
    if (pathname.startsWith("/i/")) {
      const pathPart = pathname.substring(3);
      const probeId = pathPart.split(".")[0];
      const isDownload = url.searchParams.get("download") === "1";

      let probe: ProbeMetadata | null = null;
      if (probeId) {
        const memCached = getProbeFromMemory(probeId);
        if (memCached.hit) {
          probe = memCached.probe;
        } else if (env.MAILPROBE_KV) {
          const raw = await env.MAILPROBE_KV.get(`probe:${probeId}`);
          if (raw) {
            try {
              probe = JSON.parse(raw) as ProbeMetadata;
            } catch (e) {}
          }
          setProbeToMemory(probeId, probe, 60);
        }
      }

      // 获取访客信息
      const ip = request.headers.get("cf-connecting-ip") || "127.0.0.1";
      const userAgent = request.headers.get("user-agent") || "";
      const referer = request.headers.get("referer") || undefined;

      // 默认 Cloudflare 原生定位
      const cfCountry = (request.cf?.country as string) || "未知";
      const cfRegion = (request.cf?.region as string) || "未知";
      const cfCity = (request.cf?.city as string) || "未知";
      const cfIsp = (request.cf?.asOrganization as string) || "未知运营商";
      const asn = request.cf?.asn as number | undefined;

      const uaParsed = parseUserAgent(userAgent);
      const clientType = `${uaParsed.os} · ${uaParsed.client}`;

      const now = new Date();
      const timeStr = new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).format(now);

      // 将 ip-prism 外部网络请求、多源解析、KV 日志持久化和钉钉告警
      // 全部移入 ctx.waitUntil 后台并行执行，图片响应 0 毫秒阻塞，彻底解决加载等待！
      ctx.waitUntil(
        (async () => {
          let country = cfCountry;
          let region = cfRegion;
          let city = cfCity;
          let isp = cfIsp;
          let locationSummary = `${country} · ${region} · ${city}`;
          let provider = "Cloudflare 原生";
          const providersList: Array<{ name: string; location: string; isp?: string }> = [];

          const cfLoc = [cfCountry, cfRegion, cfCity].filter(c => c && c !== "未知").join(" · ");
          if (cfLoc) {
            providersList.push({
              name: "Cloudflare 边缘",
              location: cfLoc,
              isp: cfIsp !== "未知运营商" ? (asn ? `${cfIsp} (AS${asn})` : cfIsp) : (asn ? `AS${asn}` : undefined)
            });
          }

          // 异步高精度多源解析
          if (env.IP_PRISM_URL && env.IP_PRISM_KEY) {
            try {
              const prismRes = await lookupIpWithPrism(env.IP_PRISM_URL, env.IP_PRISM_KEY, ip);
              if (prismRes.success) {
                if (prismRes.country) country = prismRes.country;
                if (prismRes.region) region = prismRes.region;
                if (prismRes.city) city = prismRes.city;
                if (prismRes.isp) isp = prismRes.isp;
                if (prismRes.location) locationSummary = prismRes.location;
                provider = "ip-prism";
                if (prismRes.providers && prismRes.providers.length > 0) {
                  providersList.push(...prismRes.providers);
                }
              }
            } catch (e) {
              // 优雅降级保持原生数据
            }
          }

          // 异步记录历史日志与更新点击计数
          if (env.MAILPROBE_KV) {
            try {
              const rawLogs = await env.MAILPROBE_KV.get("logs:recent");
              const logs: ProbeTriggerLog[] = rawLogs ? JSON.parse(rawLogs) : [];
              const newLog: ProbeTriggerLog = {
                logId: crypto.randomUUID(),
                probeId: probeId || "unknown",
                note: probe?.note || "未知探针",
                filename: probe?.filename || "unknown.png",
                ip,
                country,
                region,
                city,
                isp: asn ? `${isp} (AS${asn})` : isp,
                asn,
                userAgent,
                clientType,
                referer,
                timestamp: timeStr,
                isDownload,
                provider,
                providers: providersList.length > 0 ? providersList : undefined
              };
              logs.unshift(newLog);
              await env.MAILPROBE_KV.put("logs:recent", JSON.stringify(logs.slice(0, 100)));

              if (probe) {
                probe.hits = (probe.hits || 0) + 1;
                probe.lastHitAt = timeStr;
                await env.MAILPROBE_KV.put(`probe:${probeId}`, JSON.stringify(probe));
              }
            } catch (e) {
              console.error("记录日志失败", e);
            }
          }

          // 异步发送钉钉加签告警
          if (env.DINGTALK_WEBHOOK && env.DINGTALK_SECRET) {
            const alertData = {
              note: probe?.note || "无备注探针",
              filename: probe?.filename || `${probeId}.png`,
              ip,
              location: locationSummary,
              isp: asn && !isp.includes("AS") ? `${isp} (AS${asn})` : isp,
              userAgent,
              clientType,
              timeStr,
              isDownload,
              provider,
              providers: providersList.length > 0 ? providersList : undefined
            };

            await sendDingTalkAlert(env.DINGTALK_WEBHOOK, env.DINGTALK_SECRET, alertData);
          }
        })()
      );

      // 核心防客户端与中间代理缓存响应头（保证收件人每次打开邮件都会发起真实 HTTP 请求）
      const antiCacheHeaders: Record<string, string> = {
        "Cache-Control": "no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0"
      };

      const ifNoneMatch = request.headers.get("if-none-match");

      // 1. R2 存储（流式 zero-copy 管道与边缘 Cache API）
      if (probe?.backend === "r2" && probe.r2Key && env.MAILPROBE_R2) {
        // 尝试从边缘 Cache 中读取（若处于 Node 测试环境则容错跳过）
        const cacheKey = `https://r2-internal-cache.mailprobe.local/${probe.r2Key}`;
        let cache: Cache | null = null;
        try {
          if (typeof caches !== "undefined" && caches.default) {
            cache = caches.default;
          }
        } catch (e) {}

        if (cache && !isDownload) {
          try {
            const cachedRes = await cache.match(cacheKey);
            if (cachedRes) {
              const etag = cachedRes.headers.get("etag");
              // 客户端命中 ETag，在日志已完整记录前提下极速返回 304 (0 字节负载)
              if (ifNoneMatch && etag && ifNoneMatch === etag) {
                return new Response(null, {
                  status: 304,
                  headers: {
                    etag,
                    ...antiCacheHeaders,
                    "X-MailProbe-Cache": "HIT-304"
                  }
                });
              }

              const resHeaders = new Headers(cachedRes.headers);
              for (const [k, v] of Object.entries(antiCacheHeaders)) {
                resHeaders.set(k, v);
              }
              resHeaders.set("X-MailProbe-Cache", "HIT");
              return new Response(cachedRes.body, {
                status: 200,
                headers: resHeaders
              });
            }
          } catch (e) {}
        }

        const object = await env.MAILPROBE_R2.get(probe.r2Key);
        if (object) {
          const etag = object.httpEtag;
          // 首次穿透 R2 物理存储命中 ETag 304
          if (ifNoneMatch && etag && ifNoneMatch === etag && !isDownload) {
            return new Response(null, {
              status: 304,
              headers: {
                etag,
                ...antiCacheHeaders,
                "X-MailProbe-Cache": "MISS-304"
              }
            });
          }

          const headers = new Headers();
          object.writeHttpMetadata(headers);
          if (etag) {
            headers.set("etag", etag);
          }

          // 用 ReadableStream.tee() 零拷贝纯流式管道，避免 arrayBuffer 堆内存拷贝与阻塞
          if (cache && !isDownload && object.body) {
            try {
              const [streamForClient, streamForCache] = object.body.tee();
              const cacheHeaders = new Headers(headers);
              cacheHeaders.set("Cache-Control", "public, max-age=86400");
              const toCacheRes = new Response(streamForCache, { headers: cacheHeaders });
              ctx.waitUntil(cache.put(cacheKey, toCacheRes));

              // 组装返回给客户端的防缓存流式响应
              for (const [k, v] of Object.entries(antiCacheHeaders)) {
                headers.set(k, v);
              }
              headers.set("X-MailProbe-Cache", "MISS");
              return new Response(streamForClient, { headers });
            } catch (e) {}
          }

          for (const [k, v] of Object.entries(antiCacheHeaders)) {
            headers.set(k, v);
          }
          if (isDownload) {
            headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(probe.filename)}"`);
          }
          return new Response(object.body, { headers });
        }
      }

      // 2. mjj.today 直链反代
      if (probe?.backend === "mjj" && probe.originUrl) {
        try {
          const originRes = await fetch(probe.originUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Accept": "image/*,*/*"
            }
          });
          if (originRes.ok && originRes.body) {
            const etag = originRes.headers.get("etag");
            // mjj.today 同样支持 ETag 304 快速回执
            if (ifNoneMatch && etag && ifNoneMatch === etag && !isDownload) {
              return new Response(null, {
                status: 304,
                headers: {
                  etag,
                  ...antiCacheHeaders,
                  "X-MailProbe-Cache": "PROXY-304"
                }
              });
            }

            const headers = new Headers(originRes.headers);
            for (const [k, v] of Object.entries(antiCacheHeaders)) {
              headers.set(k, v);
            }
            if (isDownload) {
              headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(probe.filename)}"`);
            }
            return new Response(originRes.body, {
              status: 200,
              headers
            });
          }
        } catch (e) {
          console.error("从图床拉取图片失败", e);
        }
      }

      // 3. 兜底回退：返回 1x1 像素透明 GIF
      return new Response(TRANSPARENT_GIF_BYTES, {
        status: 200,
        headers: {
          "Content-Type": "image/gif",
          ...antiCacheHeaders
        }
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};
