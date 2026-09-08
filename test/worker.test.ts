import { describe, it, expect, vi, beforeEach } from "vitest";
import worker from "../src/index";
import { parseUserAgent } from "../src/dingtalk";
import { isPrivateIp, lookupIpWithPrism } from "../src/ipprism";
import { Env, ProbeMetadata } from "../src/types";

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
    async delete(key: string) {
      store.delete(key);
    },
    _raw: store
  };
}

describe("MailProbe-Worker 全功能测试", () => {
  let mockKV: any;
  let mockR2: any;

  beforeEach(() => {
    mockKV = createMockKV();
    mockR2 = createMockR2();
  });

  it("GET / 自动 302 重定向到 /admin，GET /admin 返回现代科技风 UI", async () => {
    const env: Env = {
      MAILPROBE_KV: mockKV,
      APP_TITLE: "邮件探针监控系统"
    };

    // 1. 测试根路径重定向
    const reqRoot = new Request("https://mailprobe.example.com/");
    const resRoot = await worker.fetch(reqRoot, env, { waitUntil: vi.fn() } as any);
    expect(resRoot.status).toBe(302);
    expect(resRoot.headers.get("Location")).toBe("https://mailprobe.example.com/admin");

    // 2. 测试 /admin 页面渲染
    const reqAdmin = new Request("https://mailprobe.example.com/admin");
    const resAdmin = await worker.fetch(reqAdmin, env, { waitUntil: vi.fn() } as any);

    expect(resAdmin.status).toBe(200);
    const html = await resAdmin.text();
    expect(html).toContain("邮件探针监控系统");
    expect(html).toContain("历史上传探针管理");
    expect(html).toContain("探针触发历史记录");
    expect(html).toContain('window.__ADMIN_PREFIX__ = "/admin"');

    // 核心保障：确保前端内嵌的所有 JavaScript 代码通过 V8 语法解析编译，杜绝任何 SyntaxError 导致前端罢工
    // 核心保障：确保前端内嵌的所有 JavaScript 代码通过 V8 语法解析编译，杜绝任何 SyntaxError 导致前端罢工
    const scriptMatches = html.match(/<script>([\s\S]*?)<\/script>/gi) || [];
    expect(scriptMatches.length).toBeGreaterThan(0);
    const vm = await import("vm");
    for (const tag of scriptMatches) {
      const code = tag.replace(/<\/?script>/gi, "");
      expect(() => new vm.Script(code)).not.toThrow();
    }
  });

  it("GET /admin/api/config 正确返回各项服务可用状态", async () => {
    const env: Env = {
      MAILPROBE_KV: mockKV,
      MJJ_API_KEY: "test_mjj_key",
      IP_PRISM_URL: "https://ip-prism.api.tski.uk",
      IP_PRISM_KEY: "tokisaki-galaxy"
    };

    const req = new Request("https://mailprobe.example.com/admin/api/config");
    const res = await worker.fetch(req, env, { waitUntil: vi.fn() } as any);

    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.mjj).toBe(true);
    expect(json.r2).toBe(false);
    expect(json.ipPrism).toBe(true);
    expect(json.dingtalk).toBe(false);
  });

  it("isPrivateIp 能正确识别内外网 IP", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("192.168.1.100")).toBe(true);
    expect(isPrivateIp("10.0.8.2")).toBe(true);
    expect(isPrivateIp("172.20.0.1")).toBe(true);
    expect(isPrivateIp("114.114.114.114")).toBe(false);
    expect(isPrivateIp("1.1.1.1")).toBe(false);
  });

  it("POST /admin/api/upload 上传并加入探针索引，GET /admin/api/probes 列出探针", async () => {
    const env: Env = {
      MAILPROBE_KV: mockKV,
      MAILPROBE_R2: mockR2
    };

    const formData = new FormData();
    formData.append("file", new File([new Uint8Array([1, 2, 3])], "doc_chart.png", { type: "image/png" }));
    formData.append("note", "测试方案图表");
    formData.append("backend", "r2");

    const reqUpload = new Request("https://mailprobe.example.com/admin/api/upload", {
      method: "POST",
      body: formData
    });

    const resUpload = await worker.fetch(reqUpload, env, { waitUntil: vi.fn() } as any);
    expect(resUpload.status).toBe(200);
    const uploadData = (await resUpload.json()) as any;
    expect(uploadData.success).toBe(true);
    const probeId = uploadData.probeId;

    // 检查列表查询
    const reqList = new Request("https://mailprobe.example.com/admin/api/probes");
    const resList = await worker.fetch(reqList, env, { waitUntil: vi.fn() } as any);
    const probes = (await resList.json()) as any[];
    expect(probes.length).toBe(1);
    expect(probes[0].id).toBe(probeId);
    expect(probes[0].note).toBe("测试方案图表");
    expect(probes[0].backend).toBe("r2");
  });

  it("DELETE /admin/api/probes/:id 支持按条件删除 R2 源文件，第三方图床严格不删除源文件", async () => {
    const env: Env = {
      MAILPROBE_KV: mockKV,
      MAILPROBE_R2: mockR2
    };

    // 1. 测试 R2 探针：deleteSource=true 时连同 R2 实体一同删除
    await mockR2.put("probes/r2_pic.png", new ArrayBuffer(8));
    const r2Probe: ProbeMetadata = {
      id: "probe_r2",
      filename: "r2_pic.png",
      note: "R2测试",
      backend: "r2",
      r2Key: "probes/r2_pic.png",
      contentType: "image/png",
      createdAt: new Date().toISOString(),
      hits: 0
    };
    await mockKV.put("probe:probe_r2", JSON.stringify(r2Probe));
    await mockKV.put("index:probes", JSON.stringify(["probe_r2"]));

    const reqDelR2 = new Request("https://mailprobe.example.com/admin/api/probes/probe_r2?deleteSource=true", {
      method: "DELETE"
    });
    const resDelR2 = await worker.fetch(reqDelR2, env, { waitUntil: vi.fn() } as any);
    expect(resDelR2.status).toBe(200);

    // 验证 R2 实体已被删除
    const r2Check = await mockR2.get("probes/r2_pic.png");
    expect(r2Check).toBeNull();

    // 2. 测试 mjj 探针：即使带 deleteSource=true，也不影响外部源
    const mjjProbe: ProbeMetadata = {
      id: "probe_mjj",
      filename: "mjj_pic.png",
      note: "MJJ测试",
      backend: "mjj",
      originUrl: "https://mjj.today/demo.jpg",
      contentType: "image/png",
      createdAt: new Date().toISOString(),
      hits: 0
    };
    await mockKV.put("probe:probe_mjj", JSON.stringify(mjjProbe));
    await mockKV.put("index:probes", JSON.stringify(["probe_mjj"]));

    const reqDelMjj = new Request("https://mailprobe.example.com/admin/api/probes/probe_mjj?deleteSource=true", {
      method: "DELETE"
    });
    const resDelMjj = await worker.fetch(reqDelMjj, env, { waitUntil: vi.fn() } as any);
    expect(resDelMjj.status).toBe(200);
    // 验证 KV 探针记录已注销
    expect(await mockKV.get("probe:probe_mjj")).toBeNull();
  });

  it("探针触发时正确记录 Cloudflare 边缘源及多源比对数据", async () => {
    const env: Env = {
      MAILPROBE_KV: mockKV
    };

    const probe: ProbeMetadata = {
      id: "probe_trigger_test",
      filename: "test.png",
      note: "测试多源探针",
      backend: "r2",
      contentType: "image/png",
      createdAt: new Date().toISOString(),
      hits: 0
    };
    await mockKV.put("probe:probe_trigger_test", JSON.stringify(probe));

    const waitUntilMock = vi.fn();
    const req = new Request("https://mailprobe.example.com/i/probe_trigger_test.png", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "CF-Connecting-IP": "114.114.114.114"
      }
    });
    // 注入 Cloudflare 边缘上下文模拟属性
    (req as any).cf = {
      country: "中国",
      region: "江苏",
      city: "南京",
      asOrganization: "中国电信",
      asn: 4134
    };

    const res = await worker.fetch(req, env, { waitUntil: waitUntilMock } as any);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/gif");

    // 触发 waitUntil 执行写入 KV
    expect(waitUntilMock).toHaveBeenCalled();
    const asyncTask = waitUntilMock.mock.calls[0][0];
    await asyncTask;

    const rawLogs = await mockKV.get("logs:recent");
    expect(rawLogs).toBeDefined();
    const logs = JSON.parse(rawLogs);
    expect(logs.length).toBe(1);
    expect(logs[0].providers).toBeDefined();
    expect(logs[0].providers.length).toBe(1);
    expect(logs[0].providers[0].name).toBe("Cloudflare 边缘");
    expect(logs[0].providers[0].location).toBe("中国 · 江苏 · 南京");
    expect(logs[0].providers[0].isp).toContain("4134");
  });

  it("客户端带 If-None-Match 请求 R2 时，依然记录日志并返回 304 快速回执", async () => {
    const env: Env = {
      MAILPROBE_KV: mockKV,
      MAILPROBE_R2: mockR2
    };

    // 在 R2 中准备图片
    await mockR2.put("probes/etag_test.png", new ArrayBuffer(16));
    const probe: ProbeMetadata = {
      id: "probe_etag",
      filename: "etag_test.png",
      note: "ETag测试",
      backend: "r2",
      r2Key: "probes/etag_test.png",
      contentType: "image/png",
      createdAt: new Date().toISOString(),
      hits: 0
    };
    await mockKV.put("probe:probe_etag", JSON.stringify(probe));

    // 先模拟获取一次 ETag
    const r2Obj = await mockR2.get("probes/etag_test.png");
    const etag = r2Obj.httpEtag;

    const waitUntilMock = vi.fn();
    const req = new Request("https://mailprobe.example.com/i/probe_etag.png", {
      headers: {
        "If-None-Match": etag,
        "CF-Connecting-IP": "1.1.1.1",
        "User-Agent": "MailClient/1.0"
      }
    });

    const res = await worker.fetch(req, env, { waitUntil: waitUntilMock } as any);
    expect(res.status).toBe(304);
    // 验证无论客户端是传统 ETag 还是设备令牌，响应都会规范注入 16 位 dev_xxxxxxxxxxxxxxxx 指纹头
    expect(res.headers.get("etag")).toMatch(/^"dev_[0-9a-f]{16}"$/);

    // 确保异步日志记录仍然照常被触发
    expect(waitUntilMock).toHaveBeenCalled();
    const asyncTask = waitUntilMock.mock.calls[0][0];
    await asyncTask;

    const rawLogs = await mockKV.get("logs:recent");
    const logs = JSON.parse(rawLogs);
    expect(logs.length).toBe(1);
    expect(logs[0].probeId).toBe("probe_etag");
  });

  it("支持 16 位设备指纹派发并在携带 If-None-Match 时继承且标记回访", async () => {
    const env: Env = {
      MAILPROBE_KV: mockKV
    };

    const probe: ProbeMetadata = {
      id: "probe_fp_test",
      filename: "fp_test.png",
      note: "指纹追踪测试",
      backend: "r2",
      contentType: "image/png",
      createdAt: new Date().toISOString(),
      hits: 0
    };
    await mockKV.put("probe:probe_fp_test", JSON.stringify(probe));

    // 第一次访问：新设备首次打开
    const waitUntilMock1 = vi.fn();
    const req1 = new Request("https://mailprobe.example.com/i/probe_fp_test.png", {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)",
        "CF-Connecting-IP": "223.5.5.5"
      }
    });

    const res1 = await worker.fetch(req1, env, { waitUntil: waitUntilMock1 } as any);
    expect(res1.status).toBe(200);
    const assignedEtag = res1.headers.get("etag");
    expect(assignedEtag).toBeDefined();
    // 验证派发了 16 位小写十六进制的 dev_xxxxxxxxxxxxxxxx 指纹令牌
    expect(assignedEtag).toMatch(/^"dev_[0-9a-f]{16}"$/);

    expect(waitUntilMock1).toHaveBeenCalled();
    await waitUntilMock1.mock.calls[0][0];

    const logsAfter1 = JSON.parse(await mockKV.get("logs:recent"));
    expect(logsAfter1[0].deviceFp).toBe(assignedEtag!.replace(/"/g, ""));
    expect(logsAfter1[0].visitCount).toBe(1);
    expect(logsAfter1[0].isRepeat).toBe(false);

    // 第二次访问：同一台 iPhone 换了 5G 网络 (IP 变动)，但带回了客户端缓存的 ETag 指纹
    const waitUntilMock2 = vi.fn();
    const req2 = new Request("https://mailprobe.example.com/i/probe_fp_test.png", {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)",
        "CF-Connecting-IP": "117.136.0.1", // 换了移动 5G IP
        "If-None-Match": assignedEtag!
      }
    });

    const res2 = await worker.fetch(req2, env, { waitUntil: waitUntilMock2 } as any);
    // 快速命中 304 快速回执
    expect(res2.status).toBe(304);

    expect(waitUntilMock2).toHaveBeenCalled();
    await waitUntilMock2.mock.calls[0][0];

    const logsAfter2 = JSON.parse(await mockKV.get("logs:recent"));
    expect(logsAfter2.length).toBe(2);
    // 验证第二次访问继承了完全相同的 16 位设备指纹，且成功识别为回访
    expect(logsAfter2[0].deviceFp).toBe(assignedEtag!.replace(/"/g, ""));
    expect(logsAfter2[0].ip).toBe("117.136.0.1");
    expect(logsAfter2[0].isRepeat).toBe(true);
    expect(logsAfter2[0].visitCount).toBe(2);
  });

  it("同一设备连按 F5（即使因隐私模式未带 If-None-Match），也能根据环境特征稳定识别为同一设备与回访", async () => {
    const env: Env = {
      MAILPROBE_KV: mockKV
    };

    const probe: ProbeMetadata = {
      id: "probe_f5_test",
      filename: "f5_test.png",
      note: "F5连按测试",
      backend: "r2",
      contentType: "image/png",
      createdAt: new Date().toISOString(),
      hits: 0
    };
    await mockKV.put("probe:probe_f5_test", JSON.stringify(probe));

    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0";
    const ip = "183.232.100.1";

    let firstFp = "";
    // 模拟连按 3 次 F5
    for (let i = 1; i <= 3; i++) {
      const waitUntilMock = vi.fn();
      const req = new Request("https://mailprobe.example.com/i/probe_f5_test.png", {
        headers: {
          "User-Agent": ua,
          "CF-Connecting-IP": ip,
          "Accept-Language": "zh-CN,zh;q=0.9"
        }
      });

      const res = await worker.fetch(req, env, { waitUntil: waitUntilMock } as any);
      expect(res.status).toBe(200);
      const etag = res.headers.get("etag");
      expect(etag).toMatch(/^"dev_[0-9a-f]{16}"$/);

      if (i === 1) {
        firstFp = etag!;
      } else {
        // 验证 3 次计算出的设备指纹 100% 完全相同，绝不随机漂移！
        expect(etag).toBe(firstFp);
      }

      expect(waitUntilMock).toHaveBeenCalled();
      await waitUntilMock.mock.calls[0][0];
    }

    const logs = JSON.parse(await mockKV.get("logs:recent"));
    expect(logs.length).toBe(3);
    // 3 次均为同一指纹
    expect(logs[0].deviceFp).toBe(firstFp.replace(/"/g, ""));
    expect(logs[1].deviceFp).toBe(firstFp.replace(/"/g, ""));
    expect(logs[2].deviceFp).toBe(firstFp.replace(/"/g, ""));

    // 验证后续两次成功识别为回访与递增计数
    expect(logs[0].visitCount).toBe(3);
    expect(logs[0].isRepeat).toBe(true);

    expect(logs[1].visitCount).toBe(2);
    expect(logs[1].isRepeat).toBe(true);

    expect(logs[2].visitCount).toBe(1);
    expect(logs[2].isRepeat).toBe(false);
  });
});
