// ============================================================
// 凯撒加密下载助手 — popup.js
// ============================================================

// --- 常量 ---

// 环境与 API 路径统一从 config.js 读取（config.js 由 config.example.js 复制而来）
// 开源版本默认只提供「自定义」环境，业务环境地址请自行配置
const ENVIRONMENTS = (typeof ENV_CONFIG !== 'undefined' && ENV_CONFIG.environments)
  ? ENV_CONFIG.environments
  : [{ key: 'custom', label: '✏️ 自定义', url: '' }];

const MAX_HISTORY = 20;
const API_PATH = (typeof ENV_CONFIG !== 'undefined' && ENV_CONFIG.apiPath)
  ? ENV_CONFIG.apiPath
  : '/api/file/download';
const STORAGE_KEYS = {
  HISTORY: 'history',
  ENV: 'envPreference',
  SHIFT: 'shiftPreference',
  CUSTOM_URL: 'customUrlPreference',
};

// --- 工具函数 ---

/** 凯撒加密：字母向后偏移 shift 位，大小写保持，数字和特殊字符不变 */
function caesarEncrypt(str, shift) {
  // 将 shift 规范化为 0~25
  const s = ((shift % 26) + 26) % 26;
  if (s === 0) return str;

  let result = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const code = ch.charCodeAt(0);

    if (code >= 0x41 && code <= 0x5a) {
      // 大写 A-Z (65-90)
      result += String.fromCharCode(((code - 65 + s) % 26) + 65);
    } else if (code >= 0x61 && code <= 0x7a) {
      // 小写 a-z (97-122)
      result += String.fromCharCode(((code - 97 + s) % 26) + 97);
    } else {
      // 数字、特殊字符 — 原样保留
      result += ch;
    }
  }
  return result;
}

/** 显示 Toast 消息 */
function showToast(msg, duration = 1800) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  // 强制回流后添加动画
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, duration);
}

/** 显示/更新状态条 */
function setStatus(type, msg) {
  const el = document.getElementById('status');
  el.className = `status ${type}`;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function clearStatus() {
  const el = document.getElementById('status');
  el.classList.add('hidden');
}

/** 格式化时间戳为简短时间 */
function formatTime(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// --- DOM 引用 ---

const $ = (id) => document.getElementById(id);

const envSelect = $('envSelect');
const customUrlInput = $('customUrl');
const shiftInput = $('shiftInput');
const rawKeyInput = $('rawKey');
const encryptBtn = $('encryptBtn');
const encryptedKeyOutput = $('encryptedKey');
const copyBtn = $('copyBtn');
const downloadBtn = $('downloadBtn');
const statusEl = $('status');
const historyList = $('historyList');
const historyCount = $('historyCount');
const clearHistoryBtn = $('clearHistoryBtn');
const historyToggle = $('historyToggle');

// --- 环境管理 ---

/** 获取当前 Base URL */
function getBaseUrl() {
  if (envSelect.value === 'custom') {
    return customUrlInput.value.trim().replace(/\/+$/, '');
  }
  const env = ENVIRONMENTS.find((e) => e.key === envSelect.value);
  return env ? env.url : '';
}

/** 保存环境偏好 */
async function saveEnvPreference() {
  const pref = {
    envKey: envSelect.value,
    customUrl: envSelect.value === 'custom' ? customUrlInput.value.trim() : '',
  };
  await chrome.storage.local.set({ [STORAGE_KEYS.ENV]: pref });
}

/** 加载环境偏好 */
async function loadEnvPreference() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.ENV);
  const pref = result[STORAGE_KEYS.ENV];
  if (pref) {
    envSelect.value = pref.envKey || 'test-cn';
    if (pref.customUrl) {
      customUrlInput.value = pref.customUrl;
    }
  }
  toggleCustomUrl();
}

/** 显示/隐藏自定义 URL 输入框 */
function toggleCustomUrl() {
  if (envSelect.value === 'custom') {
    customUrlInput.classList.remove('hidden');
  } else {
    customUrlInput.classList.add('hidden');
  }
}

envSelect.addEventListener('change', () => {
  toggleCustomUrl();
  saveEnvPreference();
});

customUrlInput.addEventListener('input', () => {
  saveEnvPreference();
});

// --- 偏移量偏好 ---

async function saveShiftPreference() {
  const shift = parseInt(shiftInput.value, 10) || 3;
  await chrome.storage.local.set({ [STORAGE_KEYS.SHIFT]: shift });
}

async function loadShiftPreference() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SHIFT);
  const shift = result[STORAGE_KEYS.SHIFT];
  if (shift !== undefined) {
    shiftInput.value = shift;
  }
}

shiftInput.addEventListener('change', saveShiftPreference);

// --- 加密 ---

encryptBtn.addEventListener('click', () => {
  const raw = rawKeyInput.value.trim();
  if (!raw) {
    setStatus('error', '⚠️ 请输入要加密的文件 Key');
    return;
  }

  const shift = parseInt(shiftInput.value, 10);
  if (isNaN(shift) || shift < 1 || shift > 25) {
    setStatus('error', '⚠️ 偏移量需要在 1~25 之间');
    return;
  }

  const encrypted = caesarEncrypt(raw, shift);
  encryptedKeyOutput.value = encrypted;
  clearStatus();
});

// 实时加密（输入时自动加密）
rawKeyInput.addEventListener('input', () => {
  const raw = rawKeyInput.value;
  if (!raw.trim()) {
    encryptedKeyOutput.value = '';
    return;
  }
  const shift = parseInt(shiftInput.value, 10) || 3;
  encryptedKeyOutput.value = caesarEncrypt(raw, shift);
});

shiftInput.addEventListener('input', () => {
  const raw = rawKeyInput.value.trim();
  if (raw) {
    const shift = parseInt(shiftInput.value, 10) || 3;
    encryptedKeyOutput.value = caesarEncrypt(raw, shift);
  }
});

// --- 复制 ---

copyBtn.addEventListener('click', async () => {
  const text = encryptedKeyOutput.value.trim();
  if (!text) {
    showToast('⚠️ 没有可复制的内容');
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast('✅ 已复制到剪贴板');
  } catch {
    // fallback
    encryptedKeyOutput.select();
    document.execCommand('copy');
    showToast('✅ 已复制到剪贴板');
  }
});

// --- 下载 ---

downloadBtn.addEventListener('click', async () => {
  const encryptedKey = encryptedKeyOutput.value.trim();
  if (!encryptedKey) {
    setStatus('error', '⚠️ 请先加密，获取加密后的 Key');
    return;
  }

  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    setStatus('error', '⚠️ 请选择或输入有效的环境地址');
    return;
  }

  const rawKey = rawKeyInput.value.trim();
  const apiUrl = `${baseUrl}${API_PATH}`;

  // UI 进入加载态
  downloadBtn.disabled = true;
  downloadBtn.textContent = '⏳ 请求中...';
  clearStatus();

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objectName: encryptedKey }),
    });

    const data = await response.json();

    if (response.ok && data.code === 200 && data.data && data.data.downloadUrl) {
      const { downloadUrl, fileName, md5 } = data.data;

      // 触发浏览器下载
      chrome.downloads.download({
        url: downloadUrl,
        filename: fileName || undefined,
        saveAs: false,
      });

      setStatus('success', `✅ 下载已开始 — ${fileName || '文件'}`);

      // 保存历史记录
      await saveHistory({
        rawKey,
        encryptedKey,
        fileName: fileName || '未知文件',
        md5: md5 || '',
        timestamp: Date.now(),
        envLabel: envSelect.options[envSelect.selectedIndex].text,
        envUrl: baseUrl,
        shift: parseInt(shiftInput.value, 10) || 3,
      });

      renderHistory();
    } else {
      setStatus('error', `❌ API 错误：${data.msg || '未知错误'} (code: ${data.code})`);
    }
  } catch (err) {
    setStatus('error', `❌ 请求失败：${err.message}`);
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = '⬇️ 获取下载链接并下载';
  }
});

// --- 历史记录 ---

/** 保存历史记录 */
async function saveHistory(record) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.HISTORY);
  let history = result[STORAGE_KEYS.HISTORY] || [];
  history.unshift(record);
  if (history.length > MAX_HISTORY) {
    history = history.slice(0, MAX_HISTORY);
  }
  await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: history });
}

/** 加载并渲染历史记录 */
async function renderHistory() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.HISTORY);
  const history = result[STORAGE_KEYS.HISTORY] || [];
  historyCount.textContent = `(${history.length})`;

  if (history.length === 0) {
    historyList.innerHTML = '<div class="history-empty">暂无历史记录</div>';
    return;
  }

  historyList.innerHTML = history
    .map(
      (item, idx) => `
    <div class="history-item" data-index="${idx}">
      <div class="history-item-main">
        <span class="history-filename" title="${item.encryptedKey}">📄 ${escapeHtml(item.fileName)}</span>
        <span class="history-time">${formatTime(item.timestamp)}</span>
      </div>
      <div class="history-item-meta">
        <span class="history-env">${escapeHtml(item.envLabel)}</span>
        <span class="history-shift">偏移 +${item.shift}</span>
      </div>
    </div>`
    )
    .join('');

  // 绑定点击事件
  historyList.querySelectorAll('.history-item').forEach((el) => {
    el.addEventListener('click', async () => {
      const idx = parseInt(el.dataset.index, 10);
      const result = await chrome.storage.local.get(STORAGE_KEYS.HISTORY);
      const history = result[STORAGE_KEYS.HISTORY] || [];
      const item = history[idx];
      if (item) {
        rawKeyInput.value = item.rawKey || '';
        shiftInput.value = item.shift || 3;

        // 尝试恢复环境
        const env = ENVIRONMENTS.find((e) => e.url === item.envUrl);
        if (env) {
          envSelect.value = env.key;
        } else if (item.envUrl) {
          envSelect.value = 'custom';
          customUrlInput.value = item.envUrl;
        }
        toggleCustomUrl();
        saveEnvPreference();

        // 自动加密
        encryptedKeyOutput.value = caesarEncrypt(item.rawKey || '', item.shift || 3);
        clearStatus();
        showToast('✅ 已回填并加密');
      }
    });
  });
}

/** 清空历史 */
clearHistoryBtn.addEventListener('click', async () => {
  if (confirm('确定要清空所有历史记录吗？此操作不可撤销。')) {
    await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: [] });
    renderHistory();
    showToast('🗑️ 历史记录已清空');
  }
});

/** HTML 转义 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --- 初始化 ---

async function init() {
  await loadEnvPreference();
  await loadShiftPreference();
  await renderHistory();
}

init();
