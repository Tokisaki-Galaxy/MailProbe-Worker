export const scripts = `
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
`;
