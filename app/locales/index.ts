export type Locale = 'zh' | 'en'

/**
 * zh is the single source of truth; en is typed against its keys, so a missing
 * English string fails typecheck instead of silently rendering a key.
 */
const zh = {
  /* nav + theme */
  'nav.home': '首页',
  'nav.workbench': '工作台',
  'nav.localeAria': '切换到英文',
  'theme.system': '跟随系统',
  'theme.light': '浅色',
  'theme.dark': '深色',

  /* home hero */
  'hero.line1': '图进来，',
  'hero.line2': '贴纸出去。',
  'hero.lead': '图片、GIF 和视频在浏览器本地转成标准贴纸。批量转换、历史归档与 Bot 上传，在同一个工作台一气呵成。',
  'hero.cta': '进入工作台',
  'hero.ctaGhost': '查看历史',

  /* ticker */
  'ticker.static': '静态贴纸',
  'ticker.video': '视频贴纸',
  'ticker.bot': 'BOT 上传',
  'ticker.local': '本地处理',

  /* quick bento */
  'quick.image.title': '静态贴纸',
  'quick.image.text': '拖入图片，输出符合规范的 512px 静态贴纸。',
  'quick.video.title': '视频贴纸',
  'quick.video.text': '动图与视频压成 VP9 编码的 WEBM，最长 3 秒。',
  'quick.upload.title': '上传发布',
  'quick.upload.text': '配置 Bot 后，勾选贴纸批量发布到目标贴纸包。',

  /* process rail */
  'process.title': '从素材到贴纸包，只保留必要步骤',
  'process.s1.name': '上传素材',
  'process.s1.text': '一次拖入图片、动图或者视频。',
  'process.s2.name': '本地转换',
  'process.s2.text': '浏览器和服务端按格式分工处理。',
  'process.s3.name': '缓存归档',
  'process.s3.text': '结果进入历史，方便筛选和复用。',
  'process.s4.name': '打包发布',
  'process.s4.text': '选择贴纸后直接上传到目标贴纸包。',

  /* specs */
  'specs.title1': '按 Telegram 规范收束输出',
  'specs.p1': '静态贴纸锁定 512px 边界，视频贴纸限制 3 秒与 256KB。已经是合规格式的输入直接复用，不做重复转码。',
  'specs.stat1': '静态贴纸边界',
  'specs.stat2': '视频贴纸时长',
  'specs.stat3': '输出文件上限',
  'specs.title2': '发布之前，先整理',
  'specs.p2': '缓存、历史、标签与批量选择在同一条线上。配置 Bot 后，勾选输出即可批量送达目标贴纸包。',
  'specs.cap1': '转换结果本地缓存',
  'specs.cap2': '按类型、格式、标签筛选',
  'specs.cap3': '批量下载与打包',
  'specs.cap4': '历史记录自动归档',

  /* dash tabs */
  'dash.tab.image': '静态贴纸',
  'dash.tab.video': '视频贴纸',
  'dash.tab.history': '历史记录',
  'dash.tab.telegram': 'Telegram',

  /* workbench shell */
  'wb.title': '贴纸工作区',
  'wb.desc': '在同一个工作区里完成转换、整理与发布。',
  'wb.metaAria': '工作区说明',
  'wb.meta1': '浏览器本地处理',
  'wb.meta2': '输出符合 Telegram 规范',
  'wb.meta3': '队列切换不丢失',

  /* task status */
  'status.pending': '待转换',
  'status.converting': '转换中',
  'status.done': '已完成',
  'status.error': '失败',

  /* image workbench */
  'image.s1.title': '静态贴纸转换',
  'image.s1.desc': 'PNG / WEBP / JPG 转 Telegram 512px 静态贴纸',
  'image.s1.badge': '浏览器本地',
  'image.upload.title': '上传图片',
  'image.upload.hint': '支持 PNG / WEBP / JPG，输出写入浏览器缓存',
  'image.s2.title': '转换队列',
  'image.s2.done': '已完成 {done}/{total}',
  'image.s2.pending': '{pending} 待处理',
  'image.btn.convert': '转换',
  'image.btn.convertAll': '全部转换',
  'image.btn.downloadPng': '下载 PNG',
  'image.btn.downloadWebp': '下载 WEBP',
  'image.btn.remove': '移除',
  'image.btn.clear': '清空',
  'image.err.convert': '转换失败',
  'rule.size.static': '静态贴纸文件超过 512KB 限制',
  'rule.size.video': '视频贴纸文件超过 256KB 限制',
  'rule.side': '贴纸尺寸必须至少一边为 512px，另一边不超过 512px',
  'rule.duration': '视频贴纸时长不能超过 3 秒',

  /* video workbench */
  'video.s1.title': '视频贴纸转换',
  'video.s1.desc': 'GIF / MP4 / WEBM 转 Telegram WEBM VP9 视频贴纸',
  'video.s1.badge': '最长 3 秒 / 256KB',
  'video.upload.title': '上传动图或视频',
  'video.upload.hint': '支持 GIF / MP4 / WEBM，浏览器本地转换，不上传源文件',
  'video.btn.convert': '转换',
  'video.btn.download': '下载',
  'video.btn.remove': '移除',
  'video.btn.convertAll': '全部转换',
  'video.btn.downloadAll': '全部下载',
  'video.btn.clear': '清空',
  'video.msg.prepare': '准备转换',
  'video.msg.reused': '已识别为合规 WEBM，直接收录',
  'video.msg.done': '转换完成',
  'video.msg.converting': '正在转换 {index}/{total}: {name}',
  'video.err.convert': '转换失败',
  'video.err.tooLarge': '源文件超过 50MB，请先裁剪后再转换',

  /* telegram workbench */
  'tg.s1.title': 'Bot 连接配置',
  'tg.s1.desc': '配置 Telegram Bot Token、用户 ID 和贴纸包信息',
  'tg.status.validating': '验证连接中...',
  'tg.status.connected': '已连接',
  'tg.status.failed': '连接失败',
  'tg.status.idle': '尚未连接',
  'tg.btn.save': '保存配置',
  'tg.btn.validate': '验证连接',
  'tg.btn.validating': '验证中...',
  'tg.label.userId': '用户 ID',
  'tg.label.emoji': '默认 Emoji',
  'tg.label.packName': '贴纸包短名称',
  'tg.label.packTitle': '贴纸包标题',
  'tg.ph.userId': '请输入 Telegram 用户 ID',
  'tg.ph.emoji': '选填，默认自动补全',
  'tg.packHistory': '最近使用的贴纸包',
  'tg.packRemove': '移除',
  'tg.s2.title': '缓存贴纸',
  'tg.s2.desc': '选择已完成转换的贴纸并上传到 Telegram',
  'tg.empty.title': '还没有缓存贴纸',
  'tg.empty.hint': '在图片或视频页完成转换后，会自动出现在这里',
  'tg.btn.refresh': '刷新列表',
  'tg.btn.clearCache': '清空缓存',
  'tg.selectAll': '全选',
  'tg.deselectAll': '取消全选',
  'tg.uploadResult': '成功 {success} / 失败 {failed}',
  'tg.packLink': '打开贴纸包',
  'tg.retryFailed': '重试失败项',
  'tg.failedTitle': '失败详情',
  'tg.emojiLabel': '该贴纸的 emoji',
  'tg.btn.upload': '上传到 Telegram',
  'tg.btn.uploading': '上传中...',
  'tg.cache.cleared': '缓存和历史已清空',
  'tg.confirmClearTitle': '清空贴纸缓存？',
  'tg.confirmClearBody': '将删除浏览器内所有已转换的贴纸文件和对应的历史记录，且无法恢复。',

  /* history panel */
  'history.s1.title': '历史档案',
  'history.s1.desc': '{count} 条记录',
  'history.selected': '{count} 已选',
  'history.search': '搜索文件名或标签',
  'history.type.all': '全部类型',
  'history.type.image': '静态贴纸',
  'history.type.video': '视频贴纸',
  'history.format.all': '全部格式',
  'history.tag.all': '全部标签',
  'history.btn.selectAll': '全选',
  'history.btn.deselectAll': '取消全选',
  'history.btn.removeSelected': '删除所选',
  'history.btn.download': '批量下载',
  'history.btn.clear': '清空历史',
  'history.confirmClearTitle': '清空全部历史？',
  'history.confirmClearBody': '将删除所有历史记录以及浏览器内已转换的贴纸文件，且无法恢复。',
  'history.group.selectAll': '全选',
  'history.tagInput': '添加标签',
  'history.s2.title': '空历史',
  'history.s2.desc': '这里会自动保存已完成的贴纸输出',
  'history.empty.title': '暂无记录',
  'history.empty.hint': '完成一次贴纸导出后，会自动归档到这里',
  'history.badge.image': '静态',
  'history.badge.video': '视频',

  /* upload zone */
  'upload.default.title': '拖拽或点击上传文件',
  'upload.pick': '选择文件',

  /* lightbox */
  'lightbox.download': '下载',
  'lightbox.close': '关闭',

  /* page meta */
  'meta.home': 'Telegram Sticker Maker - 贴纸制作工作台',
  'meta.dash': '工作台 - Telegram Sticker Maker',
  'meta.homeDesc': '把图片、GIF 和视频转换为 Telegram 贴纸格式，支持批量处理、历史缓存和 Bot 上传。',

  /* aria labels */
  'aria.quickLinks': '快速入口',
  'aria.footer': '页面底部导航',
  'aria.searchHistory': '搜索记录',
  'aria.typeFilter': '类型筛选',
  'aria.formatFilter': '格式筛选',
  'aria.tagFilter': '标签筛选',

  /* runtime strings surfaced from utils as message keys (see tRuntime) */
  'sys.ffmpegLoadFailed': 'ffmpeg.wasm 加载失败，请刷新页面后重试',
  'sys.exportImageFailed': '浏览器无法导出贴纸图片',
  'sys.videoDecodeFailed': '浏览器无法解码这个视频，请换 MP4/WEBM 或先转成常见格式',
  'sys.videoDecodeError': '视频解码失败',
  'sys.fixingWebmMeta': '正在修复 WEBM 元数据',
  'sys.vp9Unsupported': '当前浏览器不支持 VP9 WebM 录制，请使用 Chrome/Edge 最新版',
  'sys.canvasVideoUnsupported': '当前浏览器不支持 Canvas 视频预处理',
  'sys.encodingVp9': '正在用浏览器编码 VP9 WebM',
  'sys.recordWebmFailed': '浏览器录制 WEBM 失败',
  'sys.encodingVp9Webm': '正在编码 VP9 WebM',
  'sys.noWebmOutput': '没有生成 WEBM 输出',
  'sys.convertDone': '转换完成',
  'sys.preprocessingFrames': '正在预处理视频帧',
  'sys.canvasImageUnsupported': '当前浏览器不支持 Canvas 图片转换',
  'sys.encodingWebm': '正在编码 WEBM',
  'sys.ffmpegConvertFailed': 'ffmpeg.wasm 转换失败',
  'sys.convertingGif': '正在转换 GIF',
  'sys.sourceTooLarge': '源视频超过 50MB，请先裁剪后再转换，避免浏览器内存溢出',
  'sys.storageFull': '浏览器存储已满，请先清空历史或缓存后再转换',
  'sys.confirm': '确认',
  'sys.cancel': '取消',
  'sys.outOfMemory': '浏览器内存不足，已重置 ffmpeg。请换更短/更小的视频，或先裁剪到 3 秒以内再试',

  /* telegram cache errors */
  'tg.err.cacheRead': '读取浏览器缓存失败',
  'tg.err.cacheClear': '清空缓存失败',
  'tg.err.validate': 'Token 验证失败',
  'tg.err.upload': '上传失败'
} as const

export type MessageKey = keyof typeof zh

const en: Record<MessageKey, string> = {
  /* nav + theme */
  'nav.home': 'Home',
  'nav.workbench': 'Workbench',
  'nav.localeAria': 'Switch to Chinese',
  'theme.system': 'System',
  'theme.light': 'Light',
  'theme.dark': 'Dark',

  /* home hero */
  'hero.line1': 'Images in,',
  'hero.line2': 'stickers out.',
  'hero.lead':
    'Images, GIFs and videos into standard stickers in your browser — batch conversion, history and Bot upload in one workspace.',
  'hero.cta': 'Enter workbench',
  'hero.ctaGhost': 'View history',

  /* ticker */
  'ticker.static': 'Static stickers',
  'ticker.video': 'Video stickers',
  'ticker.bot': 'Bot upload',
  'ticker.local': 'Local processing',

  /* quick bento */
  'quick.image.title': 'Static stickers',
  'quick.image.text': 'Drop in images and export spec-compliant 512px static stickers.',
  'quick.video.title': 'Video stickers',
  'quick.video.text': 'Compress GIFs and videos into VP9-encoded WEBM, up to 3 seconds.',
  'quick.upload.title': 'Upload & publish',
  'quick.upload.text': 'Once your Bot is configured, tick stickers to publish them in bulk to a target pack.',

  /* process rail */
  'process.title': 'From raw files to a sticker pack, with only the necessary steps',
  'process.s1.name': 'Upload',
  'process.s1.text': 'Drag in images, GIFs or videos all at once.',
  'process.s2.name': 'Convert locally',
  'process.s2.text': 'Browser and server split the work by format.',
  'process.s3.name': 'Cache & archive',
  'process.s3.text': 'Results land in history for easy filtering and reuse.',
  'process.s4.name': 'Publish',
  'process.s4.text': 'Select stickers and upload them straight to a target pack.',

  /* specs */
  'specs.title1': 'Output tightened to Telegram specs',
  'specs.p1':
    'Static stickers are locked to a 512px boundary; video stickers are capped at 3 seconds and 256KB. Inputs already in a compliant format are reused as-is — no redundant re-encoding.',
  'specs.stat1': 'Static boundary',
  'specs.stat2': 'Video duration',
  'specs.stat3': 'Output size cap',
  'specs.title2': 'Tidy up before you publish',
  'specs.p2':
    'Cache, history, tags and bulk selection on one line. Once your Bot is configured, tick the outputs to deliver them to a target pack in bulk.',
  'specs.cap1': 'Conversions cached locally',
  'specs.cap2': 'Filter by type, format and tag',
  'specs.cap3': 'Bulk download and packaging',
  'specs.cap4': 'History archived automatically',

  /* dash tabs */
  'dash.tab.image': 'Static',
  'dash.tab.video': 'Video',
  'dash.tab.history': 'History',
  'dash.tab.telegram': 'Telegram',

  /* workbench shell */
  'wb.title': 'Sticker workspace',
  'wb.desc': 'Convert, organize and publish in a single workspace.',
  'wb.metaAria': 'Workspace notes',
  'wb.meta1': 'Processed locally in your browser',
  'wb.meta2': 'Output meets Telegram specs',
  'wb.meta3': 'Queue switches without data loss',

  /* task status */
  'status.pending': 'Pending',
  'status.converting': 'Converting',
  'status.done': 'Done',
  'status.error': 'Failed',

  /* image workbench */
  'image.s1.title': 'Static sticker conversion',
  'image.s1.desc': 'PNG / WEBP / JPG to Telegram 512px static stickers',
  'image.s1.badge': 'Local in browser',
  'image.upload.title': 'Upload images',
  'image.upload.hint': 'Supports PNG / WEBP / JPG; output is written to browser cache',
  'image.s2.title': 'Conversion queue',
  'image.s2.done': '{done}/{total} done',
  'image.s2.pending': '{pending} pending',
  'image.btn.convert': 'Convert',
  'image.btn.convertAll': 'Convert all',
  'image.btn.downloadPng': 'Download PNG',
  'image.btn.downloadWebp': 'Download WEBP',
  'image.btn.remove': 'Remove',
  'image.btn.clear': 'Clear',
  'image.err.convert': 'Conversion failed',
  'rule.size.static': 'Static sticker exceeds the 512 KB limit',
  'rule.size.video': 'Video sticker exceeds the 256 KB limit',
  'rule.side': 'One side must be 512 px and the other no more than 512 px',
  'rule.duration': 'Video stickers cannot exceed 3 seconds',

  /* video workbench */
  'video.s1.title': 'Video sticker conversion',
  'video.s1.desc': 'GIF / MP4 / WEBM to Telegram WEBM VP9 video stickers',
  'video.s1.badge': 'Max 3s / 256KB',
  'video.upload.title': 'Upload GIF or video',
  'video.upload.hint': 'Supports GIF / MP4 / WEBM; converted locally — source files are never uploaded',
  'video.btn.convert': 'Convert',
  'video.btn.download': 'Download',
  'video.btn.remove': 'Remove',
  'video.btn.convertAll': 'Convert all',
  'video.btn.downloadAll': 'Download all',
  'video.btn.clear': 'Clear',
  'video.msg.prepare': 'Preparing',
  'video.msg.reused': 'Compliant WEBM detected — archived directly',
  'video.msg.done': 'Conversion complete',
  'video.msg.converting': 'Converting {index}/{total}: {name}',
  'video.err.convert': 'Conversion failed',
  'video.err.tooLarge': 'Source file exceeds 50MB — trim it first',

  /* telegram workbench */
  'tg.s1.title': 'Bot connection',
  'tg.s1.desc': 'Configure your Telegram Bot token, user ID and pack info',
  'tg.status.validating': 'Validating...',
  'tg.status.connected': 'Connected',
  'tg.status.failed': 'Connection failed',
  'tg.status.idle': 'Not connected',
  'tg.btn.save': 'Save config',
  'tg.btn.validate': 'Validate',
  'tg.btn.validating': 'Validating...',
  'tg.label.userId': 'User ID',
  'tg.label.emoji': 'Default emoji',
  'tg.label.packName': 'Pack short name',
  'tg.label.packTitle': 'Pack title',
  'tg.ph.userId': 'Enter your Telegram user ID',
  'tg.ph.emoji': 'Optional — auto-filled by default',
  'tg.packHistory': 'Recent packs',
  'tg.packRemove': 'Remove',
  'tg.s2.title': 'Cached stickers',
  'tg.s2.desc': 'Pick converted stickers and upload them to Telegram',
  'tg.empty.title': 'No cached stickers yet',
  'tg.empty.hint': 'Finish a conversion on the image or video tab and it will show up here',
  'tg.btn.refresh': 'Refresh list',
  'tg.btn.clearCache': 'Clear cache',
  'tg.selectAll': 'Select all',
  'tg.deselectAll': 'Deselect all',
  'tg.uploadResult': '{success} succeeded / {failed} failed',
  'tg.packLink': 'Open sticker pack',
  'tg.retryFailed': 'Retry failed',
  'tg.failedTitle': 'Failed files',
  'tg.emojiLabel': 'Emoji for this sticker',
  'tg.btn.upload': 'Upload to Telegram',
  'tg.btn.uploading': 'Uploading...',
  'tg.cache.cleared': 'Cache and history cleared',
  'tg.confirmClearTitle': 'Clear the sticker cache?',
  'tg.confirmClearBody': 'This deletes every converted sticker in this browser together with its history entry, and cannot be undone.',

  /* history panel */
  'history.s1.title': 'History archive',
  'history.s1.desc': '{count} records',
  'history.selected': '{count} selected',
  'history.search': 'Search file name or tag',
  'history.type.all': 'All types',
  'history.type.image': 'Static',
  'history.type.video': 'Video',
  'history.format.all': 'All formats',
  'history.tag.all': 'All tags',
  'history.btn.selectAll': 'Select all',
  'history.btn.deselectAll': 'Deselect all',
  'history.btn.removeSelected': 'Delete selected',
  'history.btn.download': 'Bulk download',
  'history.btn.clear': 'Clear history',
  'history.confirmClearTitle': 'Clear all history?',
  'history.confirmClearBody': 'This deletes every history entry together with the converted sticker files in this browser, and cannot be undone.',
  'history.group.selectAll': 'Select all',
  'history.tagInput': 'Add tag',
  'history.s2.title': 'Empty history',
  'history.s2.desc': 'Completed sticker outputs are saved here automatically',
  'history.empty.title': 'No records yet',
  'history.empty.hint': 'Records are archived here automatically after an export',
  'history.badge.image': 'Static',
  'history.badge.video': 'Video',

  /* upload zone */
  'upload.default.title': 'Drag & drop or click to upload',
  'upload.pick': 'Choose files',

  /* lightbox */
  'lightbox.download': 'Download',
  'lightbox.close': 'Close',

  /* page meta */
  'meta.home': 'Telegram Sticker Maker - Sticker Workspace',
  'meta.dash': 'Workspace - Telegram Sticker Maker',
  'meta.homeDesc': 'Convert images, GIFs and videos into Telegram sticker formats, with batch processing, history caching and Bot uploads.',

  /* aria labels */
  'aria.quickLinks': 'Quick links',
  'aria.footer': 'Footer navigation',
  'aria.searchHistory': 'Search records',
  'aria.typeFilter': 'Type filter',
  'aria.formatFilter': 'Format filter',
  'aria.tagFilter': 'Tag filter',

  /* runtime strings surfaced from utils as message keys (see tRuntime) */
  'sys.ffmpegLoadFailed': 'ffmpeg.wasm failed to load — refresh the page and try again',
  'sys.exportImageFailed': 'The browser could not export the sticker image',
  'sys.videoDecodeFailed': 'This video cannot be decoded here — switch to MP4/WEBM or convert it first',
  'sys.videoDecodeError': 'Video decoding failed',
  'sys.fixingWebmMeta': 'Fixing WEBM metadata',
  'sys.vp9Unsupported': 'This browser cannot record VP9 WebM — use the latest Chrome/Edge',
  'sys.canvasVideoUnsupported': 'This browser does not support Canvas video preprocessing',
  'sys.encodingVp9': 'Encoding VP9 WebM in your browser',
  'sys.recordWebmFailed': 'Recording WEBM in the browser failed',
  'sys.encodingVp9Webm': 'Encoding VP9 WebM',
  'sys.noWebmOutput': 'No WEBM output was produced',
  'sys.convertDone': 'Conversion complete',
  'sys.preprocessingFrames': 'Preprocessing video frames',
  'sys.canvasImageUnsupported': 'This browser does not support Canvas image conversion',
  'sys.encodingWebm': 'Encoding WEBM',
  'sys.ffmpegConvertFailed': 'ffmpeg.wasm conversion failed',
  'sys.convertingGif': 'Converting GIF',
  'sys.sourceTooLarge': 'Source video exceeds 50MB — trim it first to avoid running out of browser memory',
  'sys.storageFull': 'Browser storage is full — clear history or the sticker cache and try again',
  'sys.confirm': 'Confirm',
  'sys.cancel': 'Cancel',
  'sys.outOfMemory': 'Out of browser memory; ffmpeg was reset. Use a shorter/smaller video, or trim it under 3 seconds and retry',

  /* telegram cache errors */
  'tg.err.cacheRead': 'Failed to read the browser cache',
  'tg.err.cacheClear': 'Failed to clear the cache',
  'tg.err.validate': 'Token validation failed',
  'tg.err.upload': 'Upload failed'
}

export const messages: Record<Locale, Record<MessageKey, string>> = { zh, en }
