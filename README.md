# Telegram Sticker Maker

在浏览器里把图片、GIF 和视频转换为符合 Telegram 官方规范的贴纸，并支持通过 Telegram Bot API 批量发布至个人贴纸包。核心媒体转码在浏览器本地运行，服务端仅作为无状态代理转发 Telegram API 请求。

---

## 功能特性

- **静态贴纸制作**：支持 PNG、WEBP、JPG 转换为最大边 512px 的静态贴纸；若输入已是符合规范的 WEBP，直接复用原文件，不二次编码。
- **视频贴纸编码**：支持 GIF、MP4、WEBM 转换为 VP9 编码的 WebM 视频贴纸，时长限制 3 秒内，自动阶梯降码率以控制体积在 256KB 以内。
- **本地缓存与历史归档**：转换结果保存在浏览器 IndexedDB 数据库（库名 `telegram-sticker-maker`），支持多维筛选（类型、格式、标签、日期）与打包 ZIP 导出。
- **贴纸包批量发布**：通过 Telegram Bot Token 验证连接，支持批量上传贴纸、创建新贴纸包或追加至已有贴纸包，可统一或按文件单独配置关联 Emoji。
- **无依赖 ZIP 打包**：基于原生 Web Streams API 的 `CompressionStream`（deflate-raw）实现，不引入额外第三方解压缩库。
- **轻量界面体验**：多标签页切换时任务队列保持常驻；支持中英双语切换与浅色、深色、跟随系统三档主题。

---

## 规格限制

| 规范项 | 限制值 | 代码判定逻辑 |
| :--- | :--- | :--- |
| 单文件上传上限 | 50 MB (`52,428,800 bytes`) | `server/utils/config.ts: config.upload.maxFileSize` |
| 单次批量文件数 | 图片 200 张 / 视频 100 个 | `server/utils/config.ts: maxImageFiles / maxVideoFiles` |
| 静态贴纸体积 | ≤ 512 KB (`524,288 bytes`) | `server/utils/config.ts: maxStaticFileSize` |
| 视频贴纸体积 | ≤ 256 KB (`262,144 bytes`) | `server/utils/config.ts: maxVideoFileSize` |
| 贴纸尺寸约束 | 至少一边为 512px，另一边 ≤ 512px | `app/utils/telegramStickerRules.ts` |
| 视频贴纸参数 | 最长 3 秒，帧率 ≤ 30fps，VP9 编码，无音频流 | `app/utils/browserStickerConverter.ts` |
| 批量上传请求体 | ≤ 8 MB (`8,388,608 bytes`) | `server/api/telegram/upload.post.ts: MAX_REQUEST_BYTES` |
| 浏览器缓存上限 | 最多 180 项，最大 40 MB | `app/utils/browserStickerStore.ts: MAX_CACHE_BYTES` |

---

## 本地运行

运行环境要求 Node.js `>= 22.19.0`：

```bash
# 安装依赖
npm install

# 启动本地开发服务 (http://localhost:3000)
npm run dev
```

本地校验与构建命令：

```bash
npm test           # 运行 vitest 单元测试（29 个用例）
npm run typecheck  # 执行 vue-tsc 类型检查
npm run build      # 构建生产产物（Nitro preset: vercel）
```

---

## 核心处理流程

### 1. 静态贴纸转码（浏览器端）
- 检验文件：若是 `image/webp` 且宽高已符合规范（一边恰好 512px 且另一边 ≤ 512px，体积 ≤ 512KB），直接跳过编码复用原 Blob。
- 否则通过 HTML5 Canvas 重绘，等比缩放至目标尺寸后导出为 WebP，结果写入本地 IndexedDB。

### 2. 视频贴纸转码（浏览器端）
- 若输入已是符合 Telegram 规范的 WebM（VP9 编码、无音频、≤ 3 秒、≤ 256KB），直接复用。
- MP4 / WEBM：通过 `<video>` 元素配合 Canvas 与 `MediaRecorder` 录制 WebM（VP9）。
- GIF：加载并调度 `ffmpeg.wasm` 执行转码。
- 码率自适应控制：若初次录制产物超出 256KB，按 `240 kbps → 180 kbps → 130 kbps → 95 kbps` 逐级降低目标码率重新录制，直至体积合规。

---

## 隐私政策与安全机制（挂载在 Vercel 时的实现）

本项目部署在 Vercel（Nitro 预设 `preset: 'vercel'`），架构为纯前端静态资源与 Serverless 无状态函数。数据流转严格遵循最小必要原则：

### 1. Telegram Bot Token 的流转与存储
- **客户端内存级持有**：在前端代码（`app/components/workbench/TelegramWorkbench.vue`）中，`botToken` 仅存在于 Vue 组件的响应式状态（`ref('')`）中。用户点击“保存配置”时，代码仅将 `userId`、`packName`、`packTitle` 和 `emoji` 存入浏览器的 `localStorage`（键名 `telegram_config`），**明确不保存 `botToken`**。刷新或关闭页面后，Token 立即从浏览器内存中释放。
- **无状态代理转发**：由于 Telegram Bot API 不支持浏览器前端直接跨域（CORS）调用，系统通过 Vercel Serverless Function 转发请求（`/api/telegram/validate` 与 `/api/telegram/upload`）。Token 仅作为 HTTPS 请求体参数在链路中传递。
- **服务端零落盘、零数据库**：服务端未挂载任何数据库、Redis 或持久化文件存储。请求处理完毕后，函数实例与内存即随 Serverless 生命周期回收，不留存任何 Token 记录。
- **日志严格脱敏**：`server/services/telegramService.ts` 与 `server/utils/logger.ts` 中仅打印接口请求状态码、目标贴纸包名称与上传文件名，**所有日志输出均不包含 Bot Token**，Vercel 平台的函数调用日志中不会留存用户凭证。
- **SSRF 阻断与正则校验**：服务端在请求发出前对 Token 实施严格白名单正则校验（`^\d{5,12}:[A-Za-z0-9_-]{30,50}$`），并将请求基址写死为 `https://api.telegram.org`，阻断路径遍历、特殊字符及恶意域名重定向。

### 2. 贴纸素材与文件隐私
- **转码过程不出域**：所有素材的解析、缩放、裁剪和转码（Canvas / ffmpeg.wasm）全部在用户本机浏览器内执行，源文件不上传至任何第三方服务器。
- **上传流量受控**：仅在用户主动勾选贴纸并点击上传时，选中的 WebP/WebM 文件才会被打包为 `multipart/form-data` 发送至 `/api/telegram/upload`。单次请求体上限强制截断为 8MB，防止内存异常。
- **中转即销毁**：Serverless 函数将贴纸文件 Buffer 组装为标准多部分表单，通过 `uploadStickerFile` 提交给 Telegram 服务器获取 `file_id`。完成 Telegram 接口交互后，Buffer 随请求生命周期销毁，服务端不保留任何副本。未勾选的历史贴纸完全保留在本地 IndexedDB，绝不产生网络请求。

### 3. 数据收集与遥测政策
- **零数据收集**：不收集、不出售、不分析任何用户个人数据。
- **零远程遥测**：代码库内未引入任何第三方埋点统计、分析 SDK 或远程性能监控组件。
- **用户对本地数据的完全控制**：所有历史生成记录与缓存均储存在本地 IndexedDB（`telegram-sticker-maker` 数据库），用户可在工作台中点击“清空缓存”一键抹除所有本地数据，或通过浏览器清除网站数据彻底移除。

---

## 目录结构

```text
app/
  assets/css/          # 全局样式与 CSS 变量
  components/
    common/            # 页头、页脚等公共布局组件
    history/           # 历史记录面板与多维筛选
    ui/                # Lightbox、ConfirmDialog、SegmentedTabs 等通用组件
    workbench/         # 图片、视频与 Telegram 工作台组件
  composables/         # 任务队列、国际化、弹窗等组合式逻辑
  layouts/  pages/  plugins/  stores/
  utils/               # 浏览器端贴纸转换、规则校验、IndexedDB 缓存、ZIP 打包
server/
  api/
    config.get.ts      # 获取上传和贴纸规范参数
    telegram/
      validate.post.ts # 验证 Bot Token 有效性
      upload.post.ts   # 接收贴纸并批量转发至 Telegram API
  services/
    telegramService.ts # Telegram API 调用封装、重试机制与参数校验
  utils/
    config.ts          # 服务端限制参数配置
    fileSecurity.ts    # 文件类型与大小校验
    logger.ts          # 轻量控制台日志封装
tests/                 # vitest 单元测试
```

---

## 计划特性

- [ ] 贴纸包的在线编辑与删除接口对接
- [ ] 从 Telegram 现有贴纸包导入素材
- [ ] 内存上传队列的状态持久化与中断恢复
- [ ] 贴纸效果预览增强

---

## 免责声明

1. 本项目仅供个人技术研究、协议兼容性探索与学习交流使用。作者与贡献者不对软件的适用性、可靠性或准确性作任何形式的明示或暗示保证。
2. 本项目不提供、不储存、不上载任何预置的图像或音视频资源，亦不参与任何第三方平台的内容制作或转码。所有媒体素材均由用户自行提供并在本地浏览器环境内实时处理。
3. 使用本项目需严格遵守使用者所在地的法律法规及相关第三方平台服务条款，不得用于商业牟利或任何侵犯他人知识产权的行为。用户使用本项目制作并上传至 Telegram 的贴纸内容需自行确保拥有合法权利或已获得充分授权。
4. 在法律允许的最大范围内，作者和贡献者不对因使用或无法使用本软件所造成的任何直接、间接、偶然或后果性损失承担责任。

---

## 开源协议

本项目遵循 [MIT License](LICENSE) 开源协议。

---

## 致谢

本项目的实现离不开以下项目与开源生态的支持，在此深表感谢：

- [Nuxt](https://nuxt.com/) / [Vue](https://vuejs.org/)：现代全栈框架与响应式视图引擎。
- [FFmpeg (ffmpeg.wasm)](https://ffmpegwasm.netlify.app/)：基于 WebAssembly 的音视频处理引擎，提供浏览器端的多媒体转码能力。
- [Pinia](https://pinia.vuejs.org/)：类型安全且直观的前端状态管理方案。
- [Lucide Icons](https://lucide.dev/)：简洁优雅的现代图标库。
- [Vitest](https://vitest.dev/)：快速可靠的单元测试框架。
- [Telegram Bot API](https://core.telegram.org/bots/api)：开放的机器人平台与贴纸管理规范。
