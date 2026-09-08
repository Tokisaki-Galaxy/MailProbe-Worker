export interface Env {
  MAILPROBE_KV: KVNamespace;
  MAILPROBE_R2?: R2Bucket;
  DINGTALK_WEBHOOK?: string;
  DINGTALK_SECRET?: string;
  MJJ_API_KEY?: string;
  APP_TITLE?: string;
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
}
