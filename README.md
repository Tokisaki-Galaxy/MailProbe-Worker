# MailProbe-Worker 📧🎯

基于 **Cloudflare Workers** 的轻量级、免维护 Serverless 邮件图片探针与图床反代中继系统。

支持通过 Web 界面上传图片、自动中转托管到第三方图床或 Cloudflare R2、通过**钉钉群机器人（加签安全认证）**实时捕获并推送收件人的真实 IP、地理位置与设备指纹，并完美兼容 **Cloudflare Zero Trust (Access)** 访问保护。

---

## ✨ 核心特性

- ⚡ **零服务器 / 免维护**：纯 Cloudflare Workers Serverless 架构，无操作系统、无容器、高可用、自动享受免费全球 CDN 加速与 SSL 证书。
- 🎨 **内置高颜值暗黑科技风控制台**：
  - 玻璃拟态与现代化科技质感界面。
  - 支持拖拽上传与实时图片预览。
  - **图床自适应识别**：根据环境变量自动检测图床可用状态，支持在 `mjj.today` 免费图床与 `Cloudflare R2` 自带存储间自由切换，未配置的后端自动置灰禁用。
  - **实时触发历史看板**：无需打开后台，网页直接展示最近触发记录（时间、备注、IP、地理位置、运营商、客户端/OS）。
- 🔔 **钉钉机器人加签告警**：
  - 采用 Web Crypto 原生计算 `HMAC-SHA256` 签名。
  - 使用 `ctx.waitUntil()` 异步非阻塞推送，探针触发瞬间毫秒级直达钉钉群，完全不影响收件人加载图片的速度。
- 🛡️ **反代中继与强力防缓存**：
  - 收件人请求直接由 Worker 反向代理真实图片流，隐藏真实图床地址。
  - 强制注入 `Cache-Control: no-cache, no-store, must-revalidate`、`Pragma: no-cache`，穿透邮件客户端与中间代理缓存。
  - 探针失效或不存在时自动降级输出 1×1 像素透明 GIF，防止邮件出现裂图破损图标。
- 🔐 **Cloudflare Zero Trust 友好**：
  - 原生支持配置分流策略：仅需一条规则即可实现**“管理控制台必须扫码/SSO登录，而探针图片路径对全公网畅通放行”**。

---

## 📸 钉钉告警预览

当收件人打开邮件或下载图片时，你的钉钉群将在 1 秒内收到如下排版的 Markdown 卡片：

> ### 🎯 邮件图片探针已被触发！
> ---
> - **探针备注**：发送给张总的项目报价单
> - **对应文件**：`quotation_v2.png`
> - **来源 IP**：`116.23.xxx.xxx`
> - **地理位置**：🇨🇳 中国 · 广东省 · 广州市
> - **网络归属**：中国电信 (AS4134)
> - **设备系统**：Windows 10/11 · Foxmail 客户端
> - **触发时间**：2026-09-08 20:15:30
> - **User-Agent**：`Mozilla/5.0 (Windows NT 10.0; Win64; x64) Foxmail 7.2`

---

## 🚀 快速部署指引

### 准备工作
1. 一个 Cloudflare 账号。
2. （可选）一个钉钉群，添加自定义机器人，安全设置勾选【加签】，复制 `Webhook` 地址与 `SEC...` 密钥。
3. （可选）[mjj.today](https://mjj.today/) 账号，登录后在【设置】->【API】中复制 API 密钥。

---

### 方式 A：使用 Wrangler CLI 一键部署（推荐）

1. **克隆项目并安装依赖**：
   ```bash
   git clone https://github.com/your-username/MailProbe-Worker.git
   cd MailProbe-Worker
   pnpm install
   ```

2. **创建 Cloudflare KV 命名空间**：
   ```bash
   pnpm exec wrangler kv:namespace create MAILPROBE_KV
   ```
   复制终端输出的 `id`，替换 `wrangler.toml` 中的 `YOUR_KV_NAMESPACE_ID`。

3. **（可选）创建 Cloudflare R2 存储桶**：
   如果你想使用 Cloudflare 自带的免费 R2 存储：
   ```bash
   pnpm exec wrangler r2 bucket create mailprobe-images
   ```
   并在 `wrangler.toml` 中取消注释 `[[r2_buckets]]` 段落。

4. **配置环境变量 / 密钥**：
   ```bash
   # 钉钉机器人 Webhook (包含 access_token)
   pnpm exec wrangler secret put DINGTALK_WEBHOOK

   # 钉钉机器人加签密钥 (SEC 开头)
   pnpm exec wrangler secret put DINGTALK_SECRET

   # mjj.today 图床 API 密钥
   pnpm exec wrangler secret put MJJ_API_KEY
   ```

5. **一键发布**：
   ```bash
   pnpm exec wrangler deploy
   ```

---

### 方式 B：Cloudflare 控制台在线粘贴部署

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，进入 **Workers & Pages** -> **Create application** -> **Create Worker**。
2. 点击 **Edit code**，将本项目 `src/` 编译后的代码或单文件内容直接复制粘贴进去，点击 **Deploy**。
3. 进入该 Worker 的 **Settings** -> **Bindings**：
   - 添加 **KV Namespace**：变量名填 `MAILPROBE_KV`，绑定一个你新建的 KV。
   - （可选）添加 **R2 Bucket**：变量名填 `MAILPROBE_R2`，绑定一个新建的 R2 存储桶。
   - 添加 **Variables and Secrets**：
     - `DINGTALK_WEBHOOK`: 钉钉 Webhook
     - `DINGTALK_SECRET`: 钉钉加签密钥
     - `MJJ_API_KEY`: mjj.today 的 API 密钥

---

## 🔒 Cloudflare Zero Trust (Access) 安全保护配置

为了防止他人滥用你的探针系统，同时确保**外部收件人能免登录加载图片**，请按照以下步骤配置：

1. 打开 Cloudflare Dashboard，进入 **Zero Trust** -> **Access** -> **Applications**。
2. 点击 **Add an application** -> 选择 **Self-hosted**。
3. **Application Configuration**：
   - **Application name**：`MailProbe`
   - **Application domain**：填写你的 Worker 自定义子域名（如 `probe.yourdomain.com`），路径留空。
4. **添加策略 1（放行探针图片 - 优先级最高，排第一位）**：
   - **Rule action**：选择 `Bypass`（绕过 / 放行）
   - **Rule name**：`Allow Public Probe Image Access`
   - **Selector**：
     - Rule type: `Include`
     - Selector: `Everyone`
   - **Path Configuration（非常关键）**：
     - 切换到页面顶部的 **Path** 规则，添加路径为：`/i/*`
5. **添加策略 2（保护管理后台与上传接口 - 排第二位）**：
   - **Rule action**：选择 `Allow`（允许访问）
   - **Rule name**：`Admin Only`
   - **Path**：留空（匹配剩余所有路径）
   - **Include**：配置为你自己的邮箱或团队账号（如 `Emails: your_email@example.com`）。

> ✅ **完成效果**：
> - 任何人访问 `https://probe.yourdomain.com/`，自动被 Zero Trust 拦截并要求验证码登录。
> - 邮件客户端向 `https://probe.yourdomain.com/i/xxxx.png` 发起请求时，直接放行中继图片，并实时触发钉钉告警！

---

## 🛠️ 本地开发与测试

本项目遵循轻量原则，编写了完整的进程内测试套件（无需挂起长驻进程即可测试全部边缘特性）：

```bash
# 类型检查
pnpm run typecheck

# 运行进程内单元测试
pnpm run test
```

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 开源。
