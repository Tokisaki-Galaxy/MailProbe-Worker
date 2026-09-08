export const styles = `
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

    .btn-compare {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-size: 0.68rem;
      font-weight: 500;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      cursor: pointer;
      transition: all 0.15s ease;
      margin-left: 0.35rem;
      vertical-align: middle;
    }

    .btn-compare:hover {
      background: #e2e8f0;
      color: #0f172a;
      border-color: #94a3b8;
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
`;
