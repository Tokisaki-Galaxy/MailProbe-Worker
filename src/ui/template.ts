export function renderBody(appTitle: string): string {
  return `
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
  `;
}
