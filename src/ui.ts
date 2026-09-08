export function renderHtml(appTitle: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-base: #0a0e17;
      --bg-surface: #111827;
      --bg-card: rgba(17, 24, 39, 0.7);
      --border-color: rgba(255, 255, 255, 0.08);
      --border-focus: rgba(99, 102, 241, 0.5);
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --primary-glow: rgba(99, 102, 241, 0.25);
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --text-dim: #6b7280;
      --success: #10b981;
      --success-bg: rgba(16, 185, 129, 0.1);
      --warning: #f59e0b;
      --danger: #ef4444;
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-base);
      background-image: 
        radial-gradient(circle at 15% 20%, rgba(99, 102, 241, 0.12) 0%, transparent 40%),
        radial-gradient(circle at 85% 75%, rgba(16, 185, 129, 0.08) 0%, transparent 45%);
      color: var(--text-main);
      font-family: var(--font-sans);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      line-height: 1.5;
    }

    header {
      border-bottom: 1px solid var(--border-color);
      backdrop-filter: blur(12px);
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(10, 14, 23, 0.75);
    }

    .header-inner {
      max-width: 1100px;
      margin: 0 auto;
      padding: 1rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 700;
      font-size: 1.15rem;
      letter-spacing: -0.02em;
    }

    .brand-icon {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--primary), #a855f7);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 16px var(--primary-glow);
    }

    .brand-icon svg {
      width: 18px;
      height: 18px;
      fill: white;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--success);
      box-shadow: 0 0 8px var(--success);
    }

    main {
      flex: 1;
      max-width: 1100px;
      width: 100%;
      margin: 0 auto;
      padding: 2rem 1.5rem 4rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .glass-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.75rem;
      backdrop-filter: blur(16px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
    }

    .section-header {
      margin-bottom: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-title {
      font-size: 1.15rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .section-title svg {
      color: var(--primary);
      width: 20px;
      height: 20px;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }

    input[type="text"] {
      width: 100%;
      padding: 0.75rem 1rem;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      color: var(--text-main);
      font-family: inherit;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    input[type="text"]:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }

    /* 图床单选组件 */
    .storage-selector {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
      margin-top: 0.5rem;
    }

    .storage-option {
      position: relative;
      display: flex;
      flex-direction: column;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      user-select: none;
    }

    .storage-option:not(.disabled):hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(99, 102, 241, 0.4);
    }

    .storage-option.selected {
      background: rgba(99, 102, 241, 0.08);
      border-color: var(--primary);
      box-shadow: 0 0 16px var(--primary-glow);
    }

    .storage-option.disabled {
      opacity: 0.45;
      cursor: not-allowed;
      filter: grayscale(0.8);
      background: rgba(0, 0, 0, 0.2);
    }

    .storage-title {
      font-weight: 600;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.35rem;
    }

    .storage-desc {
      font-size: 0.75rem;
      color: var(--text-dim);
    }

    .badge {
      font-size: 0.65rem;
      padding: 0.15rem 0.45rem;
      border-radius: 6px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .badge-success {
      background: var(--success-bg);
      color: var(--success);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .badge-disabled {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-dim);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    /* 拖拽上传区域 */
    .dropzone {
      border: 2px dashed var(--border-color);
      border-radius: 12px;
      padding: 2.5rem 1.5rem;
      text-align: center;
      background: rgba(0, 0, 0, 0.2);
      cursor: pointer;
      transition: all 0.25s;
      position: relative;
    }

    .dropzone.dragover {
      border-color: var(--primary);
      background: rgba(99, 102, 241, 0.06);
    }

    .dropzone-icon {
      width: 44px;
      height: 44px;
      margin: 0 auto 0.75rem;
      color: var(--primary);
      opacity: 0.8;
    }

    .dropzone-hint {
      font-size: 0.85rem;
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
      width: 54px;
      height: 54px;
      object-fit: cover;
      border-radius: 8px;
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
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      font-family: inherit;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--primary), #8b5cf6);
      color: white;
      box-shadow: 0 4px 14px var(--primary-glow);
      width: 100%;
      margin-top: 1.25rem;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px var(--primary-glow);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 0.4rem 0.75rem;
      font-size: 0.75rem;
      border-radius: 8px;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    /* 生成结果展示区 */
    .result-box {
      display: none;
      margin-top: 1.5rem;
      padding: 1.25rem;
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(99, 102, 241, 0.3);
    }

    .result-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--success);
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 1rem;
    }

    .copy-item {
      margin-bottom: 0.85rem;
    }

    .copy-item label {
      font-size: 0.75rem;
      color: var(--text-dim);
      margin-bottom: 0.25rem;
    }

    .copy-group {
      display: flex;
      gap: 0.5rem;
    }

    .copy-input {
      flex: 1;
      padding: 0.5rem 0.75rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: 0.78rem;
    }

    .btn-copy {
      padding: 0.5rem 0.85rem;
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid var(--primary);
      color: #c7d2fe;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.75rem;
      white-space: nowrap;
      transition: all 0.2s;
    }

    .btn-copy:hover {
      background: var(--primary);
      color: white;
    }

    /* 历史记录表格 */
    .table-container {
      overflow-x: auto;
      margin-top: 1rem;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;
      text-align: left;
    }

    th {
      padding: 0.75rem 1rem;
      color: var(--text-dim);
      font-weight: 600;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: var(--text-muted);
    }

    tr:hover td {
      background: rgba(255, 255, 255, 0.015);
    }

    .tag {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.7rem;
      font-family: var(--font-mono);
    }

    .tag-ip {
      background: rgba(99, 102, 241, 0.1);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }

    .tag-location {
      background: rgba(16, 185, 129, 0.1);
      color: #6ee7b7;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .empty-state {
      padding: 3rem 1rem;
      text-align: center;
      color: var(--text-dim);
      font-size: 0.85rem;
    }

    /* Toast 消息提示 */
    .toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      padding: 0.75rem 1.25rem;
      background: #1f2937;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      color: var(--text-main);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      font-size: 0.85rem;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 100;
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
      <div class="status-badge">
        <span class="status-dot"></span>
        <span id="dingtalk-status">钉钉加签监控中</span>
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
        <label>探针备注 / 标签（例如：发送给张三的方案配图）</label>
        <input type="text" id="probe-note" placeholder="选填，用于钉钉告警和历史记录中识别受众目标" />
      </div>

      <div class="form-group">
        <label>选择图床存储后端</label>
        <div class="storage-selector">
          <!-- mjj.today -->
          <div class="storage-option" id="opt-mjj" data-backend="mjj">
            <div class="storage-title">
              <span>mjj.today 免费图床</span>
              <span class="badge" id="badge-mjj">检测中...</span>
            </div>
            <div class="storage-desc">通过 Chevereto API 托管图片，无存储空间限制</div>
          </div>

          <!-- Cloudflare R2 -->
          <div class="storage-option" id="opt-r2" data-backend="r2">
            <div class="storage-title">
              <span>Cloudflare 自带存储 (R2)</span>
              <span class="badge" id="badge-r2">检测中...</span>
            </div>
            <div class="storage-desc">私有 S3 兼容对象存储，零外部依赖，极速响应</div>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>选择或拖入图片</label>
        <div class="dropzone" id="dropzone">
          <input type="file" id="file-input" accept="image/*" style="display: none;" />
          <svg class="dropzone-icon" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"/></svg>
          <div class="dropzone-hint">点击选择文件，或将图片拖拽至此处 (支持 PNG, JPG, GIF, WebP)</div>
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

      <!-- 生成结果展示 -->
      <div class="result-box" id="result-box">
        <div class="result-title">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          探针生成成功！复制下方代码即可嵌入邮件
        </div>

        <div class="copy-item">
          <label>1. HTML 邮件透明像素（隐蔽侦测，对方无感知）</label>
          <div class="copy-group">
            <input type="text" class="copy-input" id="code-pixel" readonly />
            <button class="btn-copy" onclick="copyText('code-pixel')">复制</button>
          </div>
        </div>

        <div class="copy-item">
          <label>2. HTML 邮件正文配图（显示真实图片，对方打开即触发）</label>
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

    <!-- 历史触发看板 -->
    <div class="glass-card">
      <div class="section-header">
        <div class="section-title">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          探针触发历史记录
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary" onclick="fetchLogs()">
            刷新记录
          </button>
          <button class="btn btn-secondary" onclick="clearLogs()" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.3);">
            清空历史
          </button>
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

  <div class="toast" id="toast"></div>

  <script>
    let selectedBackend = null;
    let selectedFile = null;
    let serverConfig = {};

    // 显示 Toast
    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.innerText = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
    }

    // 复制文本
    function copyText(id) {
      const input = document.getElementById(id);
      input.select();
      navigator.clipboard.writeText(input.value).then(() => {
        showToast('已复制到剪贴板！');
      });
    }

    // 初始化获取后端可用状态
    async function initConfig() {
      try {
        const res = await fetch('/api/config');
        serverConfig = await res.json();

        // 钉钉状态
        if (!serverConfig.dingtalk) {
          document.getElementById('dingtalk-status').innerText = '钉钉未配置密钥 (不推送)';
          document.getElementById('dingtalk-status').style.color = 'var(--text-dim)';
        }

        // mjj 选项状态
        const optMjj = document.getElementById('opt-mjj');
        const badgeMjj = document.getElementById('badge-mjj');
        if (serverConfig.mjj) {
          badgeMjj.innerText = '已就绪';
          badgeMjj.className = 'badge badge-success';
          optMjj.onclick = () => selectBackend('mjj');
          if (!selectedBackend) selectBackend('mjj');
        } else {
          badgeMjj.innerText = '未配置 MJJ_API_KEY';
          badgeMjj.className = 'badge badge-disabled';
          optMjj.classList.add('disabled');
        }

        // R2 选项状态
        const optR2 = document.getElementById('opt-r2');
        const badgeR2 = document.getElementById('badge-r2');
        if (serverConfig.r2) {
          badgeR2.innerText = '已就绪';
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
        console.error('获取后端状态失败', err);
      }
    }

    function selectBackend(backend) {
      selectedBackend = backend;
      document.querySelectorAll('.storage-option').forEach(el => {
        el.classList.remove('selected');
      });
      document.getElementById('opt-' + backend)?.classList.add('selected');
      checkUploadReady();
    }

    function checkUploadReady() {
      const btn = document.getElementById('btn-upload');
      btn.disabled = !(selectedFile && selectedBackend);
    }

    // 文件选择与拖拽
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
      if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
      }
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) {
        handleFile(e.target.files[0]);
      }
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

    // 上传处理
    document.getElementById('btn-upload').addEventListener('click', async () => {
      if (!selectedFile || !selectedBackend) return;

      const btn = document.getElementById('btn-upload');
      const btnText = document.getElementById('btn-text');
      btn.disabled = true;
      btnText.innerText = '正在上传并中转至图床...';

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('note', document.getElementById('probe-note').value);
      formData.append('backend', selectedBackend);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (data.success) {
          showToast('上传成功，探针已就绪！');
          document.getElementById('result-box').style.display = 'block';
          
          document.getElementById('code-pixel').value = '<img src="' + data.probeUrl + '" width="1" height="1" alt="" style="display:none;" />';
          document.getElementById('code-img').value = '<img src="' + data.probeUrl + '" alt="' + (data.filename || 'image') + '" />';
          document.getElementById('code-raw').value = data.probeUrl;
        } else {
          showToast('上传失败: ' + (data.error || '未知错误'));
        }
      } catch (err) {
        showToast('网络请求失败，请检查连接');
      } finally {
        btn.disabled = false;
        btnText.innerText = '立即上传并生成探针';
      }
    });

    // 获取并渲染历史记录
    async function fetchLogs() {
      const tbody = document.getElementById('logs-tbody');
      try {
        const res = await fetch('/api/logs');
        const logs = await res.json();

        if (!logs || logs.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="empty-state">暂无探针触发记录</td></tr>';
          return;
        }

        tbody.innerHTML = logs.map(log => {
          return '<tr>' +
            '<td style="white-space:nowrap;">' + (log.timestamp || '-') + '</td>' +
            '<td><strong style="color:var(--text-main);">' + (escapeHtml(log.note) || '无备注') + '</strong><br><span style="font-size:0.75rem;color:var(--text-dim);">' + escapeHtml(log.filename) + '</span></td>' +
            '<td><span class="tag tag-ip">' + log.ip + '</span></td>' +
            '<td><span class="tag tag-location">' + (escapeHtml(log.country) + ' · ' + escapeHtml(log.region) + ' · ' + escapeHtml(log.city)) + '</span></td>' +
            '<td>' + escapeHtml(log.isp || '未知') + (log.asn ? ' (' + log.asn + ')' : '') + '</td>' +
            '<td><span style="color:var(--text-main);">' + escapeHtml(log.clientType) + '</span></td>' +
          '</tr>';
        }).join('');
      } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state" style="color:var(--danger)">加载历史记录失败</td></tr>';
      }
    }

    async function clearLogs() {
      if (!confirm('确定要清空所有探针触发历史记录吗？')) return;
      try {
        await fetch('/api/logs', { method: 'DELETE' });
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

    // 页面初始化
    initConfig();
    fetchLogs();
    // 每 15 秒轮询一次日志
    setInterval(fetchLogs, 15000);
  </script>
</body>
</html>`;
}
