# Telegram Sticker Maker

Telegram 贴纸制作与上传工具。支持静态 / 动态贴纸转换，批量处理，一键上传到贴纸包。

## 功能

- **静态贴纸** — PNG / WEBP / JPG → 512x512 贴纸
- **动态贴纸** — GIF / MP4 / WEBM → WEBM VP9 贴纸
- **Telegram 集成** — 验证 Bot Token、创建贴纸包、批量上传
- **批量操作** — 多文件处理、ZIP 批量下载
- **浏览器缓存输出** — 转换结果内联回传并缓存到浏览器侧，降低临时文件 404 概率
- **统一文件命名** — 转换后文件名使用 `时间戳-hash`（如 `1715101234567-a1b2c3d4e5f6.webp`），避免重名冲突
- **历史记录** — 时间线归档、搜索、筛选
- **深色模式** — 跟随系统 / 手动切换（系统 / 浅色 / 深色）
- **响应式** — 移动端适配、灯箱预览

## 技术栈

- **前端：** Nuxt 4、Vue 3、Pinia
- **图片处理：** Sharp（服务端 Nitro）
- **视频处理：** FFmpeg.wasm
- **部署：** Vercel

## 环境要求

- Node.js >= 22

## 快速开始

```bash
npm install
npm run dev
```

## 构建部署

```bash
npm run build
npm run preview
```

## 环境变量

无需环境变量。Telegram Bot Token 在 UI 中按需输入。

## 项目结构

```text
app/                      # Nuxt 4 前端
  assets/css/             # 设计系统与样式
  components/             # Vue 组件
  composables/            # useLightbox 等组合式函数
  layouts/                # 页面布局（含主题切换）
  pages/                  # 路由页面
  stores/                 # Pinia 状态管理
  utils/                  # 工具函数
server/                   # Nitro 后端
  api/                    # API 端点
  services/               # 图片 / 视频 / Telegram 服务
  utils/                  # 配置、日志、文件清理
```

## Future

- [x] ffmpeg.wasm
- [ ] 贴纸包管理（编辑、删除）
- [ ] 贴纸预览（动态贴纸动图）
- [ ] 贴纸包分享链接
- [ ] 贴纸包导入（从 Telegram 导入现有贴纸包）

## License

MIT
