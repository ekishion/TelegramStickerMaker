# Telegram Sticker Maker

Telegram 贴纸制作与上传工具。支持静态贴纸、视频贴纸转换，批量处理、历史归档，以及一键上传到 Telegram 贴纸包。

## 功能

- **静态贴纸转换**：支持 `PNG / WEBP / JPG` 输入，输出符合 Telegram 规范的静态贴纸。
- **视频贴纸转换**：支持 `GIF / MP4 / WEBM` 输入，输出符合 Telegram 规范的 `WEBM` 视频贴纸。
- **合规文件直通**：当输入本身已经是合规的 `WEBP / WEBM` 时，直接复用原文件，不再重复转码。
- **浏览器端优先处理**：主要转换逻辑在浏览器内完成，减少服务端依赖，更适合直接部署到 Vercel。
- **结果缓存**：转换结果会缓存到浏览器本地，便于后续下载、上传和复用。
- **历史记录**：自动记录已完成的输出结果，支持筛选、搜索、批量下载和删除。
- **Telegram 上传**：支持验证 Bot Token、选择贴纸结果并批量上传到指定贴纸包。
- **工作台保活**：在 `/dash` 内切换标签页时，上传队列不会因为视图切换而丢失。
- **统一命名**：输出文件默认使用 `时间戳-hash.ext` 形式命名，避免重名冲突。
- **主题切换**：支持跟随系统、浅色、深色三种模式。

## 当前处理逻辑

### 静态贴纸

1. 上传 `PNG / WEBP / JPG`
2. 如果输入是已合规的 `WEBP`，直接复用
3. 否则在浏览器内绘制并导出结果
4. 输出结果进入本地缓存和历史记录

### 视频贴纸

1. 上传 `GIF / MP4 / WEBM`
2. 如果输入是已合规的 `WEBM`，直接复用
3. 否则优先走浏览器端视频处理流程生成结果
4. 输出结果进入本地缓存和历史记录

## 技术栈

- **前端**：Nuxt 4、Vue 3、Pinia
- **浏览器处理**：Canvas、MediaRecorder、IndexedDB
- **辅助转码**：FFmpeg.wasm
- **服务端**：Nitro
- **部署**：Vercel

## 环境要求

- Node.js `>= 22`

## 快速开始

```bash
npm install
npm run dev
```

开发地址：

- [http://localhost:3000](http://localhost:3000)

## 构建

```bash
npm run build
npm run preview
```

## 环境变量

默认不需要额外环境变量。

Telegram Bot Token、用户 ID、贴纸包名称等信息在 UI 内填写即可。

## 项目结构

```text
app/                      # Nuxt 前端
  assets/                 # 全局样式与设计变量
  components/             # 页面与业务组件
  composables/            # 组合式逻辑
  layouts/                # 布局
  pages/                  # 页面路由
  stores/                 # Pinia 状态
  utils/                  # 浏览器转换、规则、缓存工具
server/                   # Nitro 服务端
  api/                    # API 路由
  services/               # Telegram 等服务
  utils/                  # 配置、校验、安全工具
```

## 使用说明

### 1. 转换贴纸

- 在工作台上传图片、动图或视频
- 选择单个转换或批量转换
- 转换结果可直接下载，也会进入历史记录

### 2. 上传到 Telegram

- 在 Telegram 页填写 Bot Token
- 验证连接
- 选择目标贴纸包信息
- 勾选已完成的贴纸结果并上传

## 说明

- 历史记录保存的是已完成输出，不是原始上传文件。
- 工作台标签页切换时会保留当前上传队列。
- 刷新页面后，未完成上传队列默认不会持久化恢复。

## Future

- [ ] 贴纸包管理（编辑、删除）
- [ ] 贴纸预览增强
- [ ] 从 Telegram 导入已有贴纸包
- [ ] 更完整的队列持久化恢复

## License

MIT
