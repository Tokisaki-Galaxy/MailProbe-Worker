import { Env, ProbeMetadata, ProbeTriggerLog, StorageBackendType } from "./types";
import { parseUserAgent, sendDingTalkAlert } from "./dingtalk";
import { uploadToMjj } from "./storage/mjj";
import { uploadToR2 } from "./storage/r2";
import { renderHtml } from "./ui";

// 1x1 像素透明 GIF 二进制数据
const TRANSPARENT_GIF_BASE64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const TRANSPARENT_GIF_BYTES = Uint8Array.from(atob(TRANSPARENT_GIF_BASE64), c => c.charCodeAt(0));

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. 首页控制台
    if (pathname === "/" || pathname === "/index.html") {
      const appTitle = env.APP_TITLE || "MailProbe 邮件探针";
      return new Response(renderHtml(appTitle), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // 2. 获取当前环境支持的图床配置
    if (pathname === "/api/config" && request.method === "GET") {
      return Response.json({
        mjj: Boolean(env.MJJ_API_KEY && env.MJJ_API_KEY.trim().length > 0),
        r2: Boolean(env.MAILPROBE_R2),
        dingtalk: Boolean(env.DINGTALK_WEBHOOK && env.DINGTALK_SECRET)
      });
    }

    // 3. 上传图片并生成探针
    if (pathname === "/api/upload" && request.method === "POST") {
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

        // 保存元数据至 KV
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
        }

        // 获取文件后缀名
        const extMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
        const ext = extMatch ? extMatch[1].toLowerCase() : "png";
        const probeUrl = `${url.origin}/i/${probeId}.${ext}`;

        return Response.json({
          success: true,
          probeId,
          probeUrl,
          filename: file.name,
          note
        });
      } catch (err: any) {
        return Response.json({ success: false, error: err?.message || String(err) }, { status: 500 });
      }
    }

    // 4. 获取探针触发历史记录
    if (pathname === "/api/logs" && request.method === "GET") {
      if (!env.MAILPROBE_KV) {
        return Response.json([]);
      }
      const rawLogs = await env.MAILPROBE_KV.get("logs:recent");
      const logs: ProbeTriggerLog[] = rawLogs ? JSON.parse(rawLogs) : [];
      return Response.json(logs);
    }

    // 5. 清空探针触发历史记录
    if (pathname === "/api/logs" && request.method === "DELETE") {
      if (env.MAILPROBE_KV) {
        await env.MAILPROBE_KV.delete("logs:recent");
      }
      return Response.json({ success: true });
    }

    // 6. 探针触发与图片反代下载入口 (路径格式: /i/:id 或 /i/:id.ext)
    if (pathname.startsWith("/i/")) {
      const pathPart = pathname.substring(3);
      const probeId = pathPart.split(".")[0];
      const isDownload = url.searchParams.get("download") === "1";

      let probe: ProbeMetadata | null = null;
      if (env.MAILPROBE_KV && probeId) {
        const raw = await env.MAILPROBE_KV.get(`probe:${probeId}`);
        if (raw) {
          try {
            probe = JSON.parse(raw) as ProbeMetadata;
          } catch (e) {}
        }
      }

      // 获取访客详细信息
      const ip = request.headers.get("cf-connecting-ip") || "127.0.0.1";
      const userAgent = request.headers.get("user-agent") || "";
      const country = (request.cf?.country as string) || "未知";
      const region = (request.cf?.region as string) || "未知";
      const city = (request.cf?.city as string) || "未知";
      const isp = (request.cf?.asOrganization as string) || "未知运营商";
      const asn = request.cf?.asn as number | undefined;
      const referer = request.headers.get("referer") || undefined;

      const uaParsed = parseUserAgent(userAgent);
      const clientType = `${uaParsed.os} · ${uaParsed.client}`;

      const now = new Date();
      // 格式化为东八区时间
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

      // 异步记录历史日志与更新点击计数
      if (env.MAILPROBE_KV) {
        ctx.waitUntil(
          (async () => {
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
                isp,
                asn,
                userAgent,
                clientType,
                referer,
                timestamp: timeStr,
                isDownload
              };
              logs.unshift(newLog);
              // 最多保留最新 100 条记录
              const trimmed = logs.slice(0, 100);
              await env.MAILPROBE_KV.put("logs:recent", JSON.stringify(trimmed));

              if (probe) {
                probe.hits = (probe.hits || 0) + 1;
                probe.lastHitAt = timeStr;
                await env.MAILPROBE_KV.put(`probe:${probeId}`, JSON.stringify(probe));
              }
            } catch (e) {
              console.error("记录日志失败", e);
            }
          })()
        );
      }

      // 异步发送钉钉加签告警
      if (env.DINGTALK_WEBHOOK && env.DINGTALK_SECRET) {
        const location = `${country} · ${region} · ${city}`;
        const alertData = {
          note: probe?.note || "无备注探针",
          filename: probe?.filename || `${probeId}.png`,
          ip,
          location,
          isp: asn ? `${isp} (AS${asn})` : isp,
          userAgent,
          clientType,
          timeStr,
          isDownload
        };

        ctx.waitUntil(
          sendDingTalkAlert(env.DINGTALK_WEBHOOK, env.DINGTALK_SECRET, alertData)
        );
      }

      // 核心图片反代中继输出
      const antiCacheHeaders = {
        "Cache-Control": "no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0"
      };

      // 1. 如果探针对应 R2 存储
      if (probe?.backend === "r2" && probe.r2Key && env.MAILPROBE_R2) {
        const object = await env.MAILPROBE_R2.get(probe.r2Key);
        if (object) {
          const headers = new Headers();
          object.writeHttpMetadata(headers);
          headers.set("etag", object.httpEtag);
          for (const [k, v] of Object.entries(antiCacheHeaders)) {
            headers.set(k, v);
          }
          if (isDownload) {
            headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(probe.filename)}"`);
          }
          return new Response(object.body, { headers });
        }
      }

      // 2. 如果探针对应 mjj.today 外部直链
      if (probe?.backend === "mjj" && probe.originUrl) {
        try {
          const originRes = await fetch(probe.originUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Accept": "image/*,*/*"
            }
          });
          if (originRes.ok && originRes.body) {
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

      // 3. 兜底回退：返回 1x1 像素透明 GIF，保证邮件客户端不显示破图图标
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
