export function renderHtml(appTitle: string, adminPrefix: string = "/admin"): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appTitle}</title>
  <script>
    window.__ADMIN_PREFIX__ = "${adminPrefix}";
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-base: #f8fafc;
      --bg-surface: #ffffff;
      --bg-card: #ffffff;
      --border-color: #e2e8f0;
      --border-focus: #2563eb;
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --primary-glow: rgba(37, 99, 235, 0.12);
      --text-main: #0f172a;
      --text-muted: #475569;
      --text-dim: #94a3b8;
      --success: #059669;
      --success-bg: #ecfdf5;
      --warning: #d97706;
      --warning-bg: #fffbeb;
      --danger: #dc2626;
      --danger-bg: #fef2f2;
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-base);
      background-image: 
        radial-gradient(circle at 10% 10%, rgba(37, 99, 235, 0.03) 0%, transparent 40%),
        radial-gradient(circle at 90% 90%, rgba(5, 150, 105, 0.03) 0%, transparent 45%);
      color: var(--text-main);
      font-family: var(--font-sans);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    header {
      border-bottom: 1px solid var(--border-color);
      backdrop-filter: blur(12px);
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(255, 255, 255, 0.85);
    }

    .header-inner {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0.9rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 700;
      font-size: 1.125rem;
      letter-spacing: -0.02em;
      color: var(--text-main);
    }

    .brand-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, var(--primary), #3b82f6);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px var(--primary-glow);
    }

    .brand-icon svg {
      width: 18px;
      height: 18px;
      fill: white;
    }

    .header-badges {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      background: #f1f5f9;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--success);
      box-shadow: 0 0 6px rgba(5, 150, 105, 0.4);
    }

    main {
      flex: 1;
      max-width: 1100px;
      width: 100%;
      margin: 0 auto;
      padding: 2rem 1.5rem 4rem;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }

    .glass-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 1.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03), 0 1px 2px -1px rgba(0, 0, 0, 0.03);
    }

    .section-header {
      margin-bottom: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-title {
      font-size: 1.05rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-main);
    }

    .section-title svg {
      color: var(--primary);
      width: 18px;
      height: 18px;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    label {
      display: block;
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }

    input[type="text"] {
      width: 100%;
      padding: 0.65rem 0.85rem;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-main);
      font-family: inherit;
      font-size: 0.875rem;
      outline: none;
      transition: all 0.2s ease;
    }

    input[type="text"]:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }

    .storage-selector {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 0.85rem;
      margin-top: 0.5rem;
    }

    .storage-option {
      position: relative;
      display: flex;
      flex-direction: column;
      padding: 1rem;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.15s ease;
      user-select: none;
    }

    .storage-option:not(.disabled):hover {
      border-color: #cbd5e1;
      background: #f8fafc;
    }

    .storage-option.selected {
      background: #eff6ff;
      border-color: var(--primary);
      box-shadow: 0 0 0 1px var(--primary);
    }

    .storage-option.disabled {
      opacity: 0.55;
      cursor: not-allowed;
      background: #f8fafc;
      border-color: #f1f5f9;
    }

    .storage-title {
      font-weight: 600;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.35rem;
      color: var(--text-main);
    }

    .storage-desc {
      font-size: 0.75rem;
      color: var(--text-dim);
    }

    .badge {
      font-size: 0.68rem;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-weight: 600;
      letter-spacing: 0.01em;
    }

    .badge-success {
      background: var(--success-bg);
      color: var(--success);
      border: 1px solid #a7f3d0;
    }

    .badge-r2 {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }

    .badge-mjj {
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
    }

    .badge-disabled {
      background: #f1f5f9;
      color: var(--text-dim);
      border: 1px solid #e2e8f0;
    }

    .dropzone {
      border: 1.5px dashed #cbd5e1;
      border-radius: 10px;
      padding: 2.25rem 1.5rem;
      text-align: center;
      background: #fafafa;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }

    .dropzone:hover {
      border-color: #94a3b8;
      background: #f8fafc;
    }

    .dropzone.dragover {
      border-color: var(--primary);
      background: #eff6ff;
    }

    .dropzone-icon {
      width: 36px;
      height: 36px;
      margin: 0 auto 0.65rem;
      color: var(--primary);
      opacity: 0.85;
    }

    .dropzone-hint {
      font-size: 0.825rem;
      color: var(--text-muted);
    }

    .dropzone-file-preview {
      display: none;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-top: 0.75rem;
    }

    .preview-thumb {
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid var(--border-color);
    }

    .file-info {
      text-align: left;
      font-size: 0.8rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 0.65rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
      font-family: inherit;
    }

    .btn-primary {
      background: var(--primary);
      color: white;
      box-shadow: 0 1px 3px rgba(37, 99, 235, 0.2);
      width: 100%;
      margin-top: 1.25rem;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--primary-hover);
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
    }

    .btn-primary:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #ffffff;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      padding: 0.35rem 0.7rem;
      font-size: 0.75rem;
      border-radius: 6px;
    }

    .btn-secondary:hover {
      background: #f8fafc;
      color: var(--text-main);
      border-color: #cbd5e1;
    }

    .btn-danger {
      background: var(--danger-bg);
      border: 1px solid #fecaca;
      color: var(--danger);
      padding: 0.35rem 0.7rem;
      font-size: 0.75rem;
      border-radius: 6px;
    }

    .btn-danger:hover {
      background: #fee2e2;
    }

    .result-box {
      display: none;
      margin-top: 1.25rem;
      padding: 1.25rem;
      border-radius: 10px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
    }

    .result-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--success);
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 0.85rem;
    }

    .copy-item {
      margin-bottom: 0.75rem;
    }

    .copy-item:last-child {
      margin-bottom: 0;
    }

    .copy-item label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
    }

    .copy-group {
      display: flex;
      gap: 0.5rem;
    }

    .copy-input {
      flex: 1;
      padding: 0.45rem 0.65rem;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      color: var(--text-main);
      font-family: var(--font-mono);
      font-size: 0.78rem;
    }

    .btn-copy {
      padding: 0.45rem 0.8rem;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: var(--text-main);
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
      transition: all 0.15s ease;
    }

    .btn-copy:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
    }

    .table-container {
      overflow-x: auto;
      margin-top: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
      text-align: left;
    }

    th {
      padding: 0.65rem 0.85rem;
      color: var(--text-muted);
      font-weight: 600;
      background: #f8fafc;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    td {
      padding: 0.75rem 0.85rem;
      border-bottom: 1px solid #f1f5f9;
      color: var(--text-muted);
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:hover td {
      background: #f8fafc;
    }

    .tag {
      display: inline-block;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-family: var(--font-mono);
      font-weight: 500;
    }

    .tag-ip {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #dbeafe;
    }

    .tag-location {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #d1fae5;
    }

    .empty-state {
      padding: 2.25rem 1rem;
      text-align: center;
      color: var(--text-dim);
      font-size: 0.825rem;
    }

    /* 模态框样式 */
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(4px);
      z-index: 200;
      align-items: center;
      justify-content: center;
    }

    .modal-overlay.active {
      display: flex;
    }

    .modal-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
      width: 90%;
      max-width: 500px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .modal-title {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text-main);
    }

    .modal-close {
      background: transparent;
      border: none;
      color: var(--text-dim);
      font-size: 1.25rem;
      cursor: pointer;
      line-height: 1;
    }

    .modal-close:hover {
      color: var(--text-main);
    }

    .checkbox-box {
      margin: 1.25rem 0;
      padding: 0.85rem;
      border-radius: 8px;
      background: #f8fafc;
      border: 1px solid var(--border-color);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-main);
      cursor: pointer;
    }

    .checkbox-label.disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .checkbox-tip {
      font-size: 0.75rem;
      color: var(--text-dim);
      margin-top: 0.35rem;
      line-height: 1.4;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.6rem;
      margin-top: 1.25rem;
    }

    .toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      padding: 0.65rem 1.15rem;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 8px;
      color: #ffffff;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      font-size: 0.825rem;
      font-weight: 500;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 300;
    }

    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }
  </style>
</head>
<body>
  <header>
    <div class="header-inner">
      <div class="brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
        </div>
        <span>${appTitle}</span>
      </div>
      <div class="header-badges">
        <div class="status-badge" id="badge-ipprism-box">
          <span class="status-dot" id="dot-ipprism"></span>
          <span id="ipprism-status">检测定位中...</span>
        </div>
        <div class="status-badge">
          <span class="status-dot"></span>
          <span id="dingtalk-status">钉钉加签就绪</span>
        </div>
      </div>
    </div>
  </header>

  <main>
    <!-- 上传卡片 -->
    <div class="glass-card">
      <div class="section-header">
        <div class="section-title">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          上传图片并生成探针
        </div>
      </div>

      <div class="form-group">
        <label>探针备注（例如：发给张三的方案配图）</label>
        <input type="text" id="probe-note" placeholder="选填，用于在钉钉通知与记录中辨别受众" />
      </div>

      <div class="form-group">
        <label>选择存储后端</label>
        <div class="storage-selector">
          <div class="storage-option" id="opt-mjj" data-backend="mjj">
            <div class="storage-title">
              <span>mjj.today 免费图床</span>
              <span class="badge" id="badge-mjj">检测中...</span>
            </div>
            <div class="storage-desc">Chevereto 远端图床托管，不占用个人存储</div>
          </div>

          <div class="storage-option" id="opt-r2" data-backend="r2">
            <div class="storage-title">
              <span>Cloudflare R2 存储</span>
              <span class="badge" id="badge-r2">检测中...</span>
            </div>
            <div class="storage-desc">Cloudflare 内部对象存储，支持自主删除源文件</div>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>选择或拖入图片</label>
        <div class="dropzone" id="dropzone">
          <input type="file" id="file-input" accept="image/*" style="display: none;" />
          <svg class="dropzone-icon" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"/></svg>
          <div class="dropzone-hint">点击选择文件，或将图片拖放至此处 (支持 PNG, JPG, GIF, WebP)</div>
          <div class="dropzone-file-preview" id="file-preview">
            <img class="preview-thumb" id="preview-img" src="" alt="preview" />
            <div class="file-info">
              <div id="file-name" style="font-weight:600; color:var(--text-main);"></div>
              <div id="file-size" style="color:var(--text-dim);"></div>
            </div>
          </div>
        </div>
      </div>

      <button class="btn btn-primary" id="btn-upload" disabled>
        <span id="btn-text">立即上传并生成探针</span>
      </button>

      <!-- 结果展示 -->
      <div class="result-box" id="result-box">
        <div class="result-title">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          探针生成完毕，复制下方代码即可嵌入邮件
        </div>

        <div class="copy-item">
          <label>1. HTML 邮件透明像素（隐蔽侦测，对方无感）</label>
          <div class="copy-group">
            <input type="text" class="copy-input" id="code-pixel" readonly />
            <button class="btn-copy" onclick="copyText('code-pixel')">复制</button>
          </div>
        </div>

        <div class="copy-item">
          <label>2. HTML 邮件正文配图（显示图片，对方打开即触发）</label>
          <div class="copy-group">
            <input type="text" class="copy-input" id="code-img" readonly />
            <button class="btn-copy" onclick="copyText('code-img')">复制</button>
          </div>
        </div>

        <div class="copy-item">
          <label>3. 原始反代直链 / 附件下载链接</label>
          <div class="copy-group">
            <input type="text" class="copy-input" id="code-raw" readonly />
            <button class="btn-copy" onclick="copyText('code-raw')">复制</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史已创建探针库 -->
    <div class="glass-card">
      <div class="section-header">
        <div class="section-title">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          历史上传探针管理
        </div>
        <button class="btn btn-secondary" onclick="fetchProbes()">刷新列表</button>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>创建时间</th>
              <th>探针备注</th>
              <th>文件名称</th>
              <th>存储后端</th>
              <th>触发次数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="probes-tbody">
            <tr>
              <td colspan="6" class="empty-state">正在加载探针列表...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 探针触发历史记录 -->
    <div class="glass-card">
      <div class="section-header">
        <div class="section-title">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          探针触发历史记录
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary" onclick="fetchLogs()">刷新记录</button>
          <button class="btn btn-secondary" onclick="clearLogs()" style="color: var(--danger); border-color: #fecaca;">清空历史</button>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>触发时间</th>
              <th>探针备注 / 文件</th>
              <th>访客公网 IP</th>
              <th>地理位置</th>
              <th>网络运营商 / ASN</th>
              <th>客户端与操作系统</th>
            </tr>
          </thead>
          <tbody id="logs-tbody">
            <tr>
              <td colspan="6" class="empty-state">正在加载触发记录...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>

  <!-- 查看探针代码弹窗 -->
  <div class="modal-overlay" id="modal-view-code">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">获取探针代码</div>
        <button class="modal-close" onclick="closeModal('modal-view-code')">&times;</button>
      </div>
      <div class="copy-item">
        <label>HTML 邮件透明像素</label>
        <div class="copy-group">
          <input type="text" class="copy-input" id="modal-code-pixel" readonly />
          <button class="btn-copy" onclick="copyText('modal-code-pixel')">复制</button>
        </div>
      </div>
      <div class="copy-item">
        <label>HTML 邮件正文配图</label>
        <div class="copy-group">
          <input type="text" class="copy-input" id="modal-code-img" readonly />
          <button class="btn-copy" onclick="copyText('modal-code-img')">复制</button>
        </div>
      </div>
      <div class="copy-item">
        <label>反代直链 / 下载地址</label>
        <div class="copy-group">
          <input type="text" class="copy-input" id="modal-code-raw" readonly />
          <button class="btn-copy" onclick="copyText('modal-code-raw')">复制</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 删除确认弹窗 (区分 R2 与 第三方存储) -->
  <div class="modal-overlay" id="modal-delete">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">删除探针确认</div>
        <button class="modal-close" onclick="closeModal('modal-delete')">&times;</button>
      </div>
      <div style="font-size:0.875rem; color:var(--text-main); margin-bottom: 0.5rem;" id="modal-del-desc">
        确定要删除该探针吗？
      </div>
      
      <div class="checkbox-box" id="modal-del-checkbox-box">
        <!-- 动态由 JavaScript 填充内容 -->
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal('modal-delete')">取消</button>
        <button class="btn btn-danger" id="btn-confirm-delete">确认删除</button>
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    let selectedBackend = null;
    let selectedFile = null;
    let serverConfig = {};
    let probeToDelete = null;

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.innerText = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
    }

    function copyText(id) {
      const input = document.getElementById(id);
      input.select();
      navigator.clipboard.writeText(input.value).then(() => {
        showToast('已复制到剪贴板');
      });
    }

    function openModal(id) {
      document.getElementById(id)?.classList.add('active');
    }

    function closeModal(id) {
      document.getElementById(id)?.classList.remove('active');
    }

    const API_BASE = (window.__ADMIN_PREFIX__ || '/admin') + '/api';

    async function initConfig() {
      try {
        const res = await fetch(API_BASE + '/config');
        serverConfig = await res.json();

        // 钉钉状态
        if (!serverConfig.dingtalk) {
          document.getElementById('dingtalk-status').innerText = '钉钉未配置密钥 (不推送)';
          document.getElementById('dingtalk-status').style.color = 'var(--text-dim)';
        }

        // ip-prism 状态
        const dotPrism = document.getElementById('dot-ipprism');
        const statusPrism = document.getElementById('ipprism-status');
        if (serverConfig.ipPrism) {
          statusPrism.innerText = 'ip-prism 高精定位已生效';
        } else {
          statusPrism.innerText = 'Cloudflare 原生定位';
          dotPrism.style.background = 'var(--text-dim)';
          dotPrism.style.boxShadow = 'none';
        }

        // mjj 选项
        const optMjj = document.getElementById('opt-mjj');
        const badgeMjj = document.getElementById('badge-mjj');
        if (serverConfig.mjj) {
          badgeMjj.innerText = '就绪';
          badgeMjj.className = 'badge badge-success';
          optMjj.onclick = () => selectBackend('mjj');
          if (!selectedBackend) selectBackend('mjj');
        } else {
          badgeMjj.innerText = '未配置 MJJ_API_KEY';
          badgeMjj.className = 'badge badge-disabled';
          optMjj.classList.add('disabled');
        }

        // R2 选项
        const optR2 = document.getElementById('opt-r2');
        const badgeR2 = document.getElementById('badge-r2');
        if (serverConfig.r2) {
          badgeR2.innerText = '就绪';
          badgeR2.className = 'badge badge-success';
          optR2.onclick = () => selectBackend('r2');
          if (!selectedBackend) selectBackend('r2');
        } else {
          badgeR2.innerText = '未绑定 R2 存储桶';
          badgeR2.className = 'badge badge-disabled';
          optR2.classList.add('disabled');
        }

        checkUploadReady();
      } catch (err) {
        console.error('获取配置失败', err);
      }
    }

    function selectBackend(backend) {
      selectedBackend = backend;
      document.querySelectorAll('.storage-option').forEach(el => el.classList.remove('selected'));
      document.getElementById('opt-' + backend)?.classList.add('selected');
      checkUploadReady();
    }

    function checkUploadReady() {
      const btn = document.getElementById('btn-upload');
      btn.disabled = !(selectedFile && selectedBackend);
    }

    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) handleFile(e.target.files[0]);
    });

    function handleFile(file) {
      if (!file.type.startsWith('image/')) {
        showToast('请上传图片格式文件');
        return;
      }
      selectedFile = file;
      document.getElementById('file-name').innerText = file.name;
      document.getElementById('file-size').innerText = (file.size / 1024).toFixed(1) + ' KB';

      const reader = new FileReader();
      reader.onload = (e) => {
        document.getElementById('preview-img').src = e.target.result;
        document.getElementById('file-preview').style.display = 'flex';
      };
      reader.readAsDataURL(file);

      checkUploadReady();
    }

    document.getElementById('btn-upload').addEventListener('click', async () => {
      if (!selectedFile || !selectedBackend) return;

      const btn = document.getElementById('btn-upload');
      const btnText = document.getElementById('btn-text');
      btn.disabled = true;
      btnText.innerText = '正在上传中转...';

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('note', document.getElementById('probe-note').value);
      formData.append('backend', selectedBackend);

      try {
        const res = await fetch(API_BASE + '/upload', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (data.success) {
          showToast('上传成功，探针已就绪');
          document.getElementById('result-box').style.display = 'block';

          document.getElementById('code-pixel').value = '<img src="' + data.probeUrl + '" width="1" height="1" alt="" style="display:none;" />';
          document.getElementById('code-img').value = '<img src="' + data.probeUrl + '" alt="' + (data.filename || 'image') + '" />';
          document.getElementById('code-raw').value = data.probeUrl;

          fetchProbes();
        } else {
          showToast('上传失败: ' + (data.error || '未知错误'));
        }
      } catch (err) {
        showToast('网络请求失败');
      } finally {
        btn.disabled = false;
        btnText.innerText = '立即上传并生成探针';
      }
    });

    // 获取并渲染历史探针列表
    async function fetchProbes() {
      const tbody = document.getElementById('probes-tbody');
      try {
        const res = await fetch(API_BASE + '/probes');
        const probes = await res.json();

        if (!probes || probes.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="empty-state">暂无已上传探针</td></tr>';
          return;
        }

        tbody.innerHTML = probes.map(p => {
          const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleString('zh-CN', { hour12: false }) : '-';
          const extMatch = p.filename.match(/\\.([a-zA-Z0-9]+)$/);
          const ext = extMatch ? extMatch[1].toLowerCase() : 'png';
          const probeUrl = window.location.origin + '/i/' + p.id + '.' + ext;
          const backendBadge = p.backend === 'r2' 
            ? '<span class="badge badge-r2">Cloudflare R2</span>' 
            : '<span class="badge badge-mjj">mjj.today</span>';

          return '<tr>' +
            '<td style="white-space:nowrap; font-family:var(--font-mono); font-size:12px;">' + dateStr + '</td>' +
            '<td><strong style="color:var(--text-main);">' + (escapeHtml(p.note) || '无备注') + '</strong></td>' +
            '<td>' + escapeHtml(p.filename) + '</td>' +
            '<td>' + backendBadge + '</td>' +
            '<td><span class="tag tag-ip">' + (p.hits || 0) + ' 次</span></td>' +
            '<td>' +
              '<div style="display:flex; gap:0.4rem;">' +
                '<button class="btn-secondary" onclick="viewProbeCode(\\'' + probeUrl + '\\', \\'' + escapeHtml(p.filename) + '\\')">获取代码</button>' +
                '<button class="btn-danger" onclick="confirmDeleteProbe(\\'' + p.id + '\\', \\'' + p.backend + '\\', \\'' + escapeHtml(p.filename) + '\\')">删除</button>' +
              '</div>' +
            '</td>' +
          '</tr>';
        }).join('');
      } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state" style="color:var(--danger)">加载探针列表失败</td></tr>';
      }
    }

    function viewProbeCode(url, filename) {
      document.getElementById('modal-code-pixel').value = '<img src="' + url + '" width="1" height="1" alt="" style="display:none;" />';
      document.getElementById('modal-code-img').value = '<img src="' + url + '" alt="' + (filename || 'image') + '" />';
      document.getElementById('modal-code-raw').value = url;
      openModal('modal-view-code');
    }

    function confirmDeleteProbe(id, backend, filename) {
      probeToDelete = { id, backend, filename };
      document.getElementById('modal-del-desc').innerText = '即将删除探针: ' + filename;

      const checkboxBox = document.getElementById('modal-del-checkbox-box');
      if (backend === 'r2') {
        checkboxBox.innerHTML = 
          '<label class="checkbox-label">' +
            '<input type="checkbox" id="chk-del-source" checked />' +
            '<span>同时从 Cloudflare R2 存储桶中永久删除原始图片</span>' +
          '</label>' +
          '<div class="checkbox-tip">勾选后将销毁 R2 中的源文件对象，释放存储空间。</div>';
      } else {
        checkboxBox.innerHTML = 
          '<label class="checkbox-label disabled">' +
            '<input type="checkbox" disabled />' +
            '<span>同时删除存储中源文件 (不支持)</span>' +
          '</label>' +
          '<div class="checkbox-tip" style="color:var(--warning);">此图片保存在第三方图床 (mjj.today)，仅清理本地探针路由与访问记录，第三方源文件不受影响。</div>';
      }

      openModal('modal-delete');
    }

    document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
      if (!probeToDelete) return;
      const chk = document.getElementById('chk-del-source');
      const deleteSource = chk ? chk.checked : false;

      try {
        const res = await fetch(API_BASE + '/probes/' + probeToDelete.id + '?deleteSource=' + deleteSource, {
          method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
          showToast('探针删除成功');
          closeModal('modal-delete');
          fetchProbes();
        } else {
          showToast('删除失败: ' + (data.error || '未知错误'));
        }
      } catch (err) {
        showToast('请求异常');
      }
    });

    async function fetchLogs() {
      const tbody = document.getElementById('logs-tbody');
      try {
        const res = await fetch(API_BASE + '/logs');
        const logs = await res.json();

        if (!logs || logs.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="empty-state">暂无探针触发记录</td></tr>';
          return;
        }

        tbody.innerHTML = logs.map(log => {
          return '<tr>' +
            '<td style="white-space:nowrap; font-family:var(--font-mono); font-size:12px;">' + (log.timestamp || '-') + '</td>' +
            '<td><strong style="color:var(--text-main);">' + (escapeHtml(log.note) || '无备注') + '</strong><br><span style="font-size:0.75rem;color:var(--text-dim);">' + escapeHtml(log.filename) + '</span></td>' +
            '<td><span class="tag tag-ip">' + log.ip + '</span></td>' +
            '<td><span class="tag tag-location">' + (escapeHtml(log.country) + ' · ' + escapeHtml(log.region) + ' · ' + escapeHtml(log.city)) + '</span></td>' +
            '<td>' + escapeHtml(log.isp || '未知') + '</td>' +
            '<td><span style="color:var(--text-main); font-size:12px;">' + escapeHtml(log.clientType) + '</span></td>' +
          '</tr>';
        }).join('');
      } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state" style="color:var(--danger)">加载历史记录失败</td></tr>';
      }
    }

    async function clearLogs() {
      if (!confirm('确定要清空所有探针触发历史记录吗？')) return;
      try {
        await fetch(API_BASE + '/logs', { method: 'DELETE' });
        showToast('历史记录已清空');
        fetchLogs();
      } catch (err) {
        showToast('清空失败');
      }
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
      });
    }

    initConfig();
    fetchProbes();
    fetchLogs();
    setInterval(fetchLogs, 15000);
  </script>
</body>
</html>`;
}
