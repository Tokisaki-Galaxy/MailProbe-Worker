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
});
