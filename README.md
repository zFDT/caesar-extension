# 🔐 凯撒加密下载助手

一个 Chrome 浏览器扩展，用于对文件 Key 进行**凯撒加密**（Caesar Cipher），并通过 API 获取文件下载链接。

---

## 功能

| 功能 | 说明 |
|------|------|
| 🔐 **凯撒加密** | 字母向后偏移（a→d），支持 1~25 自定义偏移量，默认 +3 |
| 🌐 **多环境切换** | 环境地址可配置（），默认仅「自定义」入口 |
| ⬇️ **一键下载** | 加密后调用下载 API，获取预签名 URL 并触发浏览器下载 |
| 📜 **历史记录** | 最近 20 条，显示文件名和时间，点击自动回填并加密 |
| 📋 **一键复制** | 加密结果一键复制到剪贴板 |
| 💾 **偏好持久化** | 环境选择、偏移量自动保存，下次打开保持不变 |

---

## 配置环境

1. 复制 `config.example.js` 为 `config.js`
2. 按需填写你自己的 `environments`（环境地址）和 `apiPath`（下载接口路径）
3. 不配置时，扩展默认只提供「✏️ 自定义」环境，可手动输入任意后端地址

> `config.js` 已加入 `.gitignore`，不会提交到仓库。

## 安装

1. 打开 Chrome 浏览器，地址栏输入 `chrome://extensions/`
2. 打开右上角 **开发者模式** 开关
3. 点击 **加载已解压的扩展程序**
4. 选择本项目的根文件夹（即包含 `manifest.json` 的目录）
5. 加载后可在工具栏看到插件图标，点击即可使用

> 💡 建议点击工具栏 🧩 图标，将插件 **固定** 到地址栏以便快速访问。

---

## 使用

### 加密文件 Key

1. 选择目标环境（默认：国内测试环境）
2. 设置偏移量（默认：3，即标准凯撒 +3）
3. 在「原始 Key」输入框中粘贴文件 Key，如：
   ```
   private/model/web/202601/07/1767779856623-DGLD4R.3mf
   ```
4. **实时预览**：输入时自动显示加密结果
5. 点击 **📋 复制** 复制加密结果，或点击 **⬇️ 获取下载链接并下载** 直接下载文件

### 历史记录

- 每次成功下载后自动保存记录
- 显示文件名和时间戳
- 点击任意历史记录 → 自动回填原始 Key 并加密
- 历史记录存储在浏览器本地，最多保留 20 条

---

## 加密规则

| 规则 | 示例 |
|------|------|
| 字母向后偏移 N 位 | a→d, b→e, c→f ... x→a, y→b, z→c（偏移 3 时） |
| 大写字母保持大写 | D→G, X→A, W→Z |
| 小写字母保持小写 | p→s, r→u, m→p |
| 数字不变 | 202601 → 202601 |
| 特殊字符不变 | `/`, `-`, `.` 原样保留 |

### 验证案例（偏移 +3）

```
输入: private/model/web/202601/07/1767779856623-DGLD4R.3mf
输出: sulydwh/prgho/zhe/202601/07/1767779856623-GJOG4U.3pi ✓

输入: private/slice-result/system/202605/19/1779183946181-EGWXM0.3mf
输出: sulydwh/volfh-uhvxow/vbvwhp/202605/19/1779183946181-HJZAP0.3pi ✓
```

---

## 环境列表

| 环境 | Base URL |
|------|----------|
| 🇨🇳 国内开发环境 | `https://iotservice-dev.atomverse.com.cn` |
| 🇨🇳 国内测试环境（默认） | `https://api-test.atomverse.com.cn` |
| 🇨🇳 国内预生产环境 | `https://api-pre.atomverse.com.cn` |
| 🇺🇸 美国测试环境 | `https://api-test.atomverse.tech` |
| 🇺🇸 美国预生产环境 | `https://api-pre.atomverse.tech` |
| ✏️ 自定义 | 手动输入 URL |

---

## 下载 API

```
POST {baseUrl}/api/3dprint/admin/file/v1/file/downloadWithoutToken
Content-Type: application/json

{
  "objectName": "<凯撒加密后的 Key>"
}
```

**响应：**

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "downloadUrl": "https://...",
    "fileName": "example.3pi",
    "md5": "abc123"
  }
}
```

> - 无需 Token 认证
> - `downloadUrl` 为预签名 URL（默认 20 分钟有效）
> - 若文件上传时 `isPublic=true`，返回域名 + 路径（无签名）

---

## 项目结构

```
凯撒加密下载助手/
├── manifest.json          # Chrome 扩展配置（Manifest V3）
├── popup.html             # 弹出窗口 UI
├── popup.js               # 核心逻辑（加密、API、历史、环境）
├── popup.css              # 暗色主题样式
├── icons/
│   ├── icon16.svg         # 16×16 图标
│   ├── icon48.svg         # 48×48 图标
│   └── icon128.svg        # 128×128 图标
└── README.md              # 本文件
```

---

## 技术栈

- **Manifest V3** — Chrome 最新扩展标准
- **Vanilla JS** — 无框架依赖，零构建步骤
- **chrome.storage.local** — 本地持久化（历史记录 + 偏好设置）
- **chrome.downloads** — 触发浏览器下载
- **Fetch API** — HTTP 请求

---

## 许可

MIT License

## 技术特色与复盘

### 技术亮点

- **Chrome 扩展（Manifest V3）开发**：以 `popup.html` + `popup.js` + `popup.css` 构成弹出窗口交互，`manifest.json` 声明 `chrome.storage.local`（历史记录与偏好持久化）和 `chrome.downloads`（触发下载）权限，无框架依赖、零构建步骤，加载即用。
- **下载链路加密**：对文件 Key 做凯撒加密（支持 1~25 自定义偏移，默认 +3，字母保持大小写、数字与 `/`、`-`、`.` 等特殊字符原样保留）后，再通过 `POST {baseUrl}/api/3dprint/admin/file/v1/file/downloadWithoutToken` 调用下载接口换取预签名 URL，实现「原始 Key → 加密 Key → 下载地址」的完整闭环，并支持实时预览与一键复制。
- **环境地址 / API 路径可配置**：通过 `config.js` 注入 `environments`（多环境 Base URL）与 `apiPath`（下载接口路径），配合 `config.example.js` 模板与 `.gitignore` 隔离，可灵活适配国内开发 / 测试 / 预生产及美国测试 / 预生产等多套环境；未配置时退化为「自定义」入口，手动输入任意后端地址即可使用。

### 个人贡献

- 独立开发该 Chrome 扩展：从扩展框架搭建、凯撒加密与下载 API 对接，到多环境配置、历史记录与偏好持久化等交互细节，均由我一人完成并落地为可运行项目。

### 收获与规划

- **收获**：完整实践了浏览器扩展开发全流程（Manifest V3、`chrome.storage` / `chrome.downloads` / Fetch API 的协作），并将「下载链路加密」这一安全需求落实到「Key 加密 + 可配置多环境 + 预签名 URL」的工程实现中，加深了对前端侧轻量加密与配置化管理思路的理解。
- **规划**：后续可补充密钥轮换与更健壮的加密算法（如 AES）以替代演示用凯撒加密，并考虑将扩展发布到 Chrome Web Store，进一步提升可用性与分发便利性。
