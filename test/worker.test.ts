import { describe, it, expect, vi } from "vitest";
import worker from "../src/index";
import { parseUserAgent } from "../src/dingtalk";
import { Env, ProbeMetadata } from "../src/types";

// 创建内存中的 Mock KV 存储
function createMockKV() {
  const store = new Map<string, string>();
  return {
    async get(key: string) {
      return store.get(key) || null;
    },
    async put(key: string, value: string) {
      store.set(key, value);
    },
    async delete(key: string) {
      store.delete(key);
    },
    _raw: store
  };
}

// 创建内存中的 Mock R2 存储
function createMockR2() {
  const store = new Map<string, { body: Uint8Array; metadata: any }>();
  return {
    async put(key: string, value: ArrayBuffer, options?: any) {
      store.set(key, { body: new Uint8Array(value), metadata: options });
    },
    async get(key: string) {
      const item = store.get(key);
      if (!item) return null;
      return {
        body: item.body,
        httpEtag: "mock-etag",
        writeHttpMetadata(headers: Headers) {
          if (item.metadata?.httpMetadata?.contentType) {
            headers.set("Content-Type", item.metadata.httpMetadata.contentType);
          }
        }
      };
    },
    _raw: store
  };
}

describe("MailProbe-Worker 进程内单元测试", () => {
  it("GET / 返回包含标题与前端界面的 HTML", async () => {
    const mockKV = createMockKV();
    const env: Env = {
      MAILPROBE_KV: mockKV as any,
      APP_TITLE: "自定义探针系统"
    };

    const req = new Request("https://mailprobe.example.com/");
    const res = await worker.fetch(req, env, { waitUntil: vi.fn() } as any);

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("<!DOCTYPE html>");
    expect(text).toContain("自定义探针系统");
    expect(text).toContain("mjj.today");
    expect(text).toContain("Cloudflare 自带存储 (R2)");
  });

  it("GET /api/config 正确返回环境变量支持状态", async () => {
    const mockKV = createMockKV();
    const envWithMjj: Env = {
      MAILPROBE_KV: mockKV as any,
      MJJ_API_KEY: "test_mjj_key",
      DINGTALK_WEBHOOK: "https://oapi.dingtalk.com/robot/send?access_token=xxx",
      DINGTALK_SECRET: "SECxxxx"
    };

    const req = new Request("https://mailprobe.example.com/api/config");
    const res = await worker.fetch(req, envWithMjj, { waitUntil: vi.fn() } as any);

    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.mjj).toBe(true);
    expect(json.r2).toBe(false);
    expect(json.dingtalk).toBe(true);
  });

  it("parseUserAgent 正确解析操作系统与主流客户端", () => {
    const foxmailUa = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Foxmail 7.2";
    const parsedFoxmail = parseUserAgent(foxmailUa);
    expect(parsedFoxmail.os).toBe("Windows 10/11");
    expect(parsedFoxmail.client).toBe("Foxmail 客户端");

    const iphoneUa = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";
    const parsedIphone = parseUserAgent(iphoneUa);
    expect(parsedIphone.os).toBe("iOS (iPhone/iPad)");
    expect(parsedIphone.client).toBe("iOS Mail / Safari");
  });

  it("POST /api/upload 使用 R2 存储并生成探针元数据", async () => {
    const mockKV = createMockKV();
    const mockR2 = createMockR2();
    const env: Env = {
      MAILPROBE_KV: mockKV as any,
      MAILPROBE_R2: mockR2 as any
    };

    const formData = new FormData();
    const file = new File([new Uint8Array([1, 2, 3, 4])], "contract.png", { type: "image/png" });
    formData.append("file", file);
    formData.append("note", "发给测试客户");
    formData.append("backend", "r2");

    const req = new Request("https://mailprobe.example.com/api/upload", {
      method: "POST",
      body: formData
    });

    const res = await worker.fetch(req, env, { waitUntil: vi.fn() } as any);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.probeUrl).toContain("https://mailprobe.example.com/i/");
    expect(json.probeUrl).toContain(".png");

    // 验证元数据已写入 KV
    const kvDataRaw = await mockKV.get(`probe:${json.probeId}`);
    expect(kvDataRaw).toBeTruthy();
    const kvData = JSON.parse(kvDataRaw!) as ProbeMetadata;
    expect(kvData.note).toBe("发给测试客户");
    expect(kvData.backend).toBe("r2");
  });

  it("GET /i/:probeId 触发探针并反代输出图片，强制防缓存头", async () => {
    const mockKV = createMockKV();
    const mockR2 = createMockR2();
    const env: Env = {
      MAILPROBE_KV: mockKV as any,
      MAILPROBE_R2: mockR2 as any
    };

    // 先在 R2 和 KV 里放置一个探针
    const testImageBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    await mockR2.put("probes/testprobe_test.png", testImageBytes.buffer, {
      httpMetadata: { contentType: "image/png" }
    });

    const metadata: ProbeMetadata = {
      id: "testprobe",
      filename: "test.png",
      note: "测试探针",
      backend: "r2",
      r2Key: "probes/testprobe_test.png",
      contentType: "image/png",
      createdAt: new Date().toISOString(),
      hits: 0
    };
    await mockKV.put("probe:testprobe", JSON.stringify(metadata));

    const waitUntilMock = vi.fn();
    const req = new Request("https://mailprobe.example.com/i/testprobe.png", {
      headers: {
        "cf-connecting-ip": "1.2.3.4",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"
      }
    });

    const res = await worker.fetch(req, env, { waitUntil: waitUntilMock } as any);
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(res.headers.get("Cache-Control")).toContain("no-cache");
    expect(res.headers.get("Pragma")).toBe("no-cache");

    // 验证 waitUntil 记录了日志
    expect(waitUntilMock).toHaveBeenCalled();
  });
});
