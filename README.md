# MailProbe-Worker

基于 Cloudflare Workers 的 Serverless 邮件图片探针与图床反代中继系统。

支持通过 Web 控制台上传图片、自动转存到第三方图床 (mjj.today) 或 Cloudflare R2、通过钉钉机器人（加签安全模式）实时捕获并回传访问者 IP 与设备特征，并原生支持 Cloudflare Zero Trust (Access) 安全保护。

---

## 核心特性

- **零服务器 / 免维护**：纯 Cloudflare Workers 架构，零服务器与证书运维负担，享有全球 CDN 与免费配额。
- **暗黑科技风控制台 (无多余 Emoji)**：
  - 玻璃拟态设计，界面利落专业。
  - 支持拖放图片与实时文件预览。
  - **环境自适应感知**：自动探测图床可用性，支持在 `mjj.today` 与 `Cloudflare R2` 间按需切换，未配置的后端自动置灰。
  - **历史上传探针管理**：随时查看以往生成的探针、被触发次数、一键调出代码弹窗再次复制。
  - **精细化删除控制**：删除探针时，支持选择是否永久销毁 R2 存储中的源文件；第三方图床源文件则受严格安全保护，禁止远程销毁。
  - **实时触发日志看板**：直接在页面上查看近期触发时间、探针备注、公网 IP、地理位置、网络运营商、操作系统与客户端环境。
- **多源高精度 IP 定位**：
  - 支持可选集成自建 [ip-prism](https://github.com/tokisaki-galaxy/ip-prism) 四光谱 IP 定位服务 (高德 + 纯真 + GeoLite2 + IPinfo)。
  - 若未配置或遭遇网络异常，全自动无缝回退到 Cloudflare 原生定位。
- **钉钉机器人加签告警**：
  - 基于 Web Crypto 原生生成 `HMAC-SHA256` 签名。
  - 采用 `ctx.waitUntil()` 异步非阻塞推送，完全不影响图片加载速度。
- **反代中继与强力防缓存**：
  - 收件人请求由 Worker 反代回传，隐藏图床真实源站。
  - 强制输出 `Cache-Control: no-cache, no-store, must-revalidate`，避免邮件客户端与网络代理产生缓存。
  - 探针失效或不存在时自动降级输出 1x1 像素透明 GIF，防止邮件客户端展示裂图图标。
- **Cloudflare Zero Trust 友好**：
  - 完美支持路径分流：管理后台与上传接口走身份验证，探针图片路由对外公开放行。

---

## 部署配置指引

### 1. 资源准备与环境变量

在 `wrangler.toml` 或 Cloudflare 控制台中配置以下内容：

| 变量 / 绑定名 | 类型 | 说明 | 必填 |
| :--- | :--- | :--- | :---: |
| `MAILPROBE_KV` | KV Binding | 存储探针元数据、索引与触发历史 | 是 |
| `MAILPROBE_R2` | R2 Binding | 存储上传的图片源文件 | 否 (使用 R2 时必选) |
| `DINGTALK_WEBHOOK` | Secret | 钉钉自定义机器人 Webhook URL | 否 |
| `DINGTALK_SECRET` | Secret | 钉钉机器人安全设置中的加签密钥 (SEC开头) | 否 |
| `MJJ_API_KEY` | Secret | mjj.today 个人设置中获取的 API 密钥 | 否 (使用 mjj 图床时必选) |
| `IP_PRISM_URL` | Variable | 自建 ip-prism 服务地址 (如 `https://ip-prism.api.tski.uk`) | 否 |
| `IP_PRISM_KEY` | Secret | ip-prism 的 API 密钥 (如 `tokisaki-galaxy`) | 否 |

### 2. 本地命令行发布 (Wrangler)

```bash
# 1. 安装依赖
pnpm install

# 2. 创建 KV 空间并填入 wrangler.toml
pnpm exec wrangler kv:namespace create MAILPROBE_KV

# 3. 设置密钥 (根据需求按需设置)
pnpm exec wrangler secret put DINGTALK_WEBHOOK
pnpm exec wrangler secret put DINGTALK_SECRET
pnpm exec wrangler secret put MJJ_API_KEY
pnpm exec wrangler secret put IP_PRISM_KEY

# 4. 发布部署
pnpm exec wrangler deploy
```

---

## Cloudflare Zero Trust (Access) 安全规则配置

1. **进入 Cloudflare Zero Trust 控制台** -> **Access** -> **Applications**。
2. **Add an Application** -> 选择 **Self-hosted**。
3. **Application configuration**：
   - **Application name**：`MailProbe Admin`
   - **Application domain**：填写你的子域名（如 `mail-image.api.tski.uk`）
   - **Path**：填写 **`admin`**（或者 `admin*`）
4. **Policy configuration**：
   - Action: `Allow`
   - Include: 你的登录邮箱或验证策略。
5. **保存即可**：
   - 进入 `https://mail-image.api.tski.uk/admin`（或访问根目录自动 302 跳转）时，Zero Trust 会强制拦截鉴权；
   - 探针图片反代下载地址 `https://mail-image.api.tski.uk/i/*` 位于子目录外，完全公开免认证，收件人正常加载无任何阻碍！

---

## 本地测试与类型检查

```bash
# 执行静态类型检查
npx tsc --noEmit

# 执行全流程进程内单元测试
npx vitest run
```

---

## 开源协议

MIT License
