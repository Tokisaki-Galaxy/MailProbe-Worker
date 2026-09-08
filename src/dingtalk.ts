import { DingTalkAlertData } from "./types";

/**
 * 解析 User-Agent 返回设备与客户端描述
 */
export function parseUserAgent(ua: string): { os: string; client: string } {
  if (!ua) return { os: "未知", client: "未知客户端" };

  let os = "未知系统";
  if (/Windows NT 10.0/i.test(ua)) os = "Windows 10/11";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/iPhone|iPad/i.test(ua)) os = "iOS (iPhone/iPad)";
  else if (/Macintosh|Mac OS X/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Linux/i.test(ua)) os = "Linux";

  let client = "通用浏览器/客户端";
  if (/Foxmail/i.test(ua)) client = "Foxmail 客户端";
  else if (/Outlook|Microsoft Office/i.test(ua)) client = "Microsoft Outlook";
  else if (/Thunderbird/i.test(ua)) client = "Mozilla Thunderbird";
  else if (/MicroMessenger/i.test(ua)) client = "微信内置浏览器";
  else if (/QQMail|QQBrowser/i.test(ua)) client = "QQ邮箱/QQ浏览器";
  else if (/AppleWebKit.*Mobile.*Safari/i.test(ua) && /iPhone|iPad/i.test(ua)) client = "iOS Mail / Safari";
  else if (/Edg\//i.test(ua)) client = "Microsoft Edge";
  else if (/Chrome\//i.test(ua)) client = "Google Chrome";
  else if (/Firefox\//i.test(ua)) client = "Mozilla Firefox";
  else if (/Safari\//i.test(ua)) client = "Apple Safari";
  else if (/curl|wget|python|httpclient/i.test(ua)) client = "命令行探测工具";

  return { os, client };
}

/**
 * 计算钉钉机器人加签并发送 Markdown 告警 (无 Emoji 极简排版)
 */
export async function sendDingTalkAlert(
  webhook: string,
  secret: string,
  data: DingTalkAlertData
): Promise<{ success: boolean; error?: string }> {
  try {
    const timestamp = Date.now();
    const stringToSign = `${timestamp}\n${secret}`;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(stringToSign)
    );

    const binary = String.fromCharCode(...new Uint8Array(signature));
    const base64Sign = btoa(binary);
    const signParam = encodeURIComponent(base64Sign);

    const delimiter = webhook.includes("?") ? "&" : "?";
    const finalUrl = `${webhook}${delimiter}timestamp=${timestamp}&sign=${signParam}`;

    const title = data.isDownload ? "[通知] 探针图片被主动下载" : "[通知] 邮件图片探针被加载";

    const providerText = data.provider ? ` (主推: ${data.provider})` : "";

    // 优雅拼接多源参考摘要（紧凑一行展示）
    let multiProvidersLine = "";
    if (data.providers && data.providers.length > 1) {
      const summaryList = data.providers.map(p => {
        const ispStr = p.isp ? ` ${p.isp}` : "";
        return `${p.name}: ${p.location}${ispStr}`;
      });
      multiProvidersLine = `\n- **多源对比**：\n  > ${summaryList.join("  \n  > ")}`;
    }

    // 格式化 16 位设备指纹与回访标识
    let deviceFpLine = "";
    if (data.deviceFp) {
      const repeatTag = data.isRepeat
        ? `⚠️ **同一设备回访 (第 ${data.visitCount || 2} 次阅读)**`
        : "新设备首次访问";
      deviceFpLine = `\n- **设备指纹**：\`${data.deviceFp}\` (${repeatTag})`;
    }

    const markdownText = `### ${title}
---
- **探针备注**：${data.note || "未设置备注"}
- **对应文件**：\`${data.filename}\`
- **来源 IP**：\`${data.ip}\`
- **地理位置**：${data.location}${providerText}${multiProvidersLine}
- **网络运营商**：${data.isp}
- **设备环境**：${data.clientType}${deviceFpLine}
- **触发时间**：${data.timeStr}
- **User-Agent**：
  > \`${data.userAgent.substring(0, 300)}\`
`;

    const response = await fetch(finalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({
        msgtype: "markdown",
        markdown: {
          title,
          text: markdownText
        }
      })
    });

    const resJson = (await response.json()) as { errcode?: number; errmsg?: string };
    if (resJson.errcode && resJson.errcode !== 0) {
      return { success: false, error: resJson.errmsg || "钉钉推送失败" };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
