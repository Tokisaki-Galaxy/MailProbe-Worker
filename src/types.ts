export interface Env {
  MAILPROBE_KV: KVNamespace;
  MAILPROBE_R2?: R2Bucket;
  DINGTALK_WEBHOOK?: string;
  DINGTALK_SECRET?: string;
  MJJ_API_KEY?: string;
  IP_PRISM_URL?: string;
  IP_PRISM_KEY?: string;
  APP_TITLE?: string;
  ADMIN_PATH?: string; // 管理后台自定义路径前缀，默认为 /admin
}

export type StorageBackendType = "mjj" | "r2";

export interface ProbeMetadata {
  id: string;
  filename: string;
  note: string;
  backend: StorageBackendType;
  originUrl?: string; // mjj.today 返回的外部真实直链
  r2Key?: string;     // R2 存储的键名
  contentType: string;
  createdAt: string;
  hits: number;
  lastHitAt?: string;
}

export interface IpProviderRecord {
  name: string;      // 例如 "Cloudflare 边缘", "高德开放平台", "纯真 CZ88"
  location: string;  // 格式化后的位置描述
  isp?: string;      // 运营商或 AS 信息
}

export interface ProbeTriggerLog {
  logId: string;
  probeId: string;
  note: string;
  filename: string;
  ip: string;
  country: string;
  region: string;
  city: string;
  isp: string;
  asn?: number;
  userAgent: string;
  clientType: string;
  referer?: string;
  timestamp: string;
  isDownload: boolean;
  provider?: string; // "ip-prism" | "cloudflare"
  providers?: IpProviderRecord[]; // 多源 Provider 解析比对列表
}

export interface DingTalkAlertData {
  note: string;
  filename: string;
  ip: string;
  location: string;
  isp: string;
  userAgent: string;
  clientType: string;
  timeStr: string;
  isDownload: boolean;
  provider?: string;
  providers?: IpProviderRecord[];
}

export interface IpPrismResult {
  ip: string;
  summary?: string;
  best?: {
    country?: { value?: string };
    region?: { value?: string };
    city?: { value?: string };
    isp?: { value?: string };
  };
  sources?: Array<{
    name?: string;
    source?: string;
    location?: string;
    country?: string;
    region?: string;
    city?: string;
    isp?: string;
    asn?: string | number;
  }>;
  providers?: Record<string, any>;
}
