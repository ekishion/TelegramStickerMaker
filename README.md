# Telegram Sticker Maker

在浏览器里把图片、GIF 和视频转成符合 Telegram 规范的贴纸，然后批量传进自己的贴纸包。转换全部在本地跑，源文件不上传给任何服务端。

## 能做什么

- PNG / WEBP / JPG 转 512px 静态贴纸；输入本身就是合规 WEBP 时直接复用原文件，不重新编码。
- GIF / MP4 / WEBM 转 VP9 的 WEBM 视频贴纸，最长 3 秒。
- 结果写进浏览器缓存，可以下载、复用，也会自动归档进历史记录。
- 历史支持搜索、按类型/格式/标签筛选、按天分组，勾选后打包成一个 zip 下载。
- 填一次 Bot Token 就能批量上传；每张贴纸可以单独指定 emoji，不给就用默认那个。
- 队列在 `/dash` 的几个标签页之间切来换去不会丢。
- 界面中英可切，主题有跟随系统、浅色、深色三档。

## 限制

- 单个文件不超过 50MB，图片视频同一把尺子。视频超了先在别处裁短，浏览器扛不住。
- 静态贴纸输出不超过 512KB，视频贴纸不超过 256KB，至少一边是 512px、另一边不超过 512px。
- 历史记录存的是转换结果，不是原始上传文件。
- 刷新页面后，没传完的队列不恢复。

## 跑起来

需要 Node.js `>= 22.19.0`：

```bash
npm install
npm run dev        # http://localhost:3000
```

提交前本地会跑的四件事：

```bash
npm test           # vitest，26 个用例
npm run typecheck  # vue-tsc
npm run build
```

## 转换流程

静态贴纸：上传 → 合规 WEBP 直接复用 → 否则 canvas 重绘导出 → 进缓存和历史。

视频贴纸：上传 → 合规 WEBM 直接复用 → 否则 MP4/WEBM 用 canvas 配 MediaRecorder 录一段 VP9，GIF 交给 ffmpeg.wasm 压 VP9。录出来超 256KB 就按 240k / 180k / 130k / 95k 四档码率重录，直到塞进上限。

## 技术栈

前端 Nuxt 4 + Vue 3 + Pinia。图片走 Canvas，视频走 MediaRecorder 和 ffmpeg.wasm，缓存走 IndexedDB。界面文案是一套扁平键的 i18n（`app/locales/index.ts`），zh 是唯一事实源，en 的类型把键钉死，少一个键 typecheck 就过不了。

服务端 Nitro 只剩三个路由：`/api/config`、`/api/telegram/validate`、`/api/telegram/upload`。Bot Token 只在请求里经过服务端转发，不落库、不写日志。token 先过一道正则，带主机名、路径、`@` 的一律 400，从根上掐掉 SSRF。

zip 下载没引第三方库：用 CompressionStream 压 deflate-raw，CRC32 和 zip 的本地头、中央目录、EOCD 都是手写的。

## 环境变量

一个都不用。Bot Token、用户 ID、贴纸包名称和标题都在界面上填，存在浏览器里。

## 目录

```text
app/
  assets/css/          # 设计变量与全局样式
  components/
    common/            # 页头页脚
    history/           # 历史面板
    ui/                # Lightbox、ConfirmDialog、SegmentedTabs 等基元
    workbench/         # 三个工作台 + MediaTaskCard
  composables/         # useMediaQueue、useLocale、useConfirm、useLightbox 等
  layouts/  pages/  plugins/  stores/
  utils/               # 转换、贴纸规则、IndexedDB、zip、i18n 运行时
server/
  api/                 # 三个路由
  services/            # Telegram 调用
  utils/               # 配置、token 与文件校验
tests/                 # vitest：贴纸规则、zip、Telegram 服务、i18n
```

## 还没做

- 贴纸包的编辑和删除（Telegram 那边有接口，前端没接）
- 从 Telegram 导入已有贴纸包
- 上传队列的持久化恢复
- 贴纸预览再细一点

## License

MIT
