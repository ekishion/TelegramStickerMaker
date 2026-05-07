import {
  TELEGRAM_STICKER_LIMITS,
  getStickerDimensions,
  objectUrlToFileName,
  stickerBaseName,
  validateTelegramStickerOutput
} from './telegramStickerRules'

export interface BrowserStickerResult {
  fileName: string
  blob: Blob
  url: string
  width: number
  height: number
  duration?: number
  size: number
}

type FfmpegModule = typeof import('@ffmpeg/ffmpeg')
type FfmpegInstance = InstanceType<FfmpegModule['FFmpeg']>

const VIDEO_FRAME_FPS = 30
const VIDEO_FRAME_QUALITY = 0.82
const MEDIA_RECORDER_MIME = 'video/webm;codecs=vp9'

let ffmpeg: FfmpegInstance | null = null
let ffmpegLoading: Promise<void> | null = null

async function getFfmpeg() {
  if (!ffmpeg) {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg')
    ffmpeg = new FFmpeg()
  }
  return ffmpeg
}

function resetFfmpeg() {
  if (ffmpeg) ffmpeg.terminate()
  ffmpeg = null
  ffmpegLoading = null
}

export async function loadStickerFfmpeg(onProgress?: (message: string) => void) {
  const instance = await getFfmpeg()
  if (instance.loaded) return instance

  if (!ffmpegLoading) {
    onProgress?.('Loading ffmpeg.wasm')
    ffmpegLoading = instance.load({
      coreURL: '/vendor/ffmpeg/esm/ffmpeg-core.js',
      wasmURL: '/vendor/ffmpeg/esm/ffmpeg-core.wasm'
    }).then(() => undefined).catch((error) => {
      resetFfmpeg()
      console.error('[ffmpeg] failed to load wasm core', error)
      throw new Error('ffmpeg.wasm 加载失败，请刷新页面后重试')
    })
  }

  await ffmpegLoading
  return instance
}

function isMemoryError(error: unknown) {
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error)
  return /memory access out of bounds|out of memory|OOM/i.test(text)
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) reject(new Error('浏览器无法导出贴纸图片'))
      else resolve(blob)
    }, type, quality)
  })
}

function loadVideo(file: File) {
  return new Promise<{ video: HTMLVideoElement; url: string; duration: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.onloadedmetadata = () => {
      resolve({ video, url, duration: Number.isFinite(video.duration) ? video.duration : TELEGRAM_STICKER_LIMITS.maxVideoDuration })
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('浏览器无法解码这个视频，请换 MP4/WEBM 或先转成常见格式'))
    }
    video.src = url
  })
}

function seekVideo(video: HTMLVideoElement, time: number) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('error', onError)
    }
    const onSeeked = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('视频解码失败'))
    }
    video.addEventListener('seeked', onSeeked, { once: true })
    video.addEventListener('error', onError, { once: true })
    video.currentTime = Math.max(0, time)
  })
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function stopStream(stream: MediaStream) {
  stream.getTracks().forEach(track => track.stop())
}

function requestRecorderData(recorder: MediaRecorder) {
  if (recorder.state === 'recording') recorder.requestData()
}

function toBlobPart(data: string | Uint8Array) {
  if (typeof data === 'string') return data
  const bytes = new Uint8Array(data.byteLength)
  bytes.set(data)
  return bytes.buffer
}

async function remuxWebmBlob(blob: Blob, onProgress?: (progress: number, message: string) => void) {
  const instance = await loadStickerFfmpeg(message => onProgress?.(90, message))
  const inputName = `recorded-${Date.now()}.webm`
  const outputName = `remuxed-${Date.now()}.webm`

  try {
    onProgress?.(90, '正在修复 WEBM 元数据')
    await instance.writeFile(inputName, new Uint8Array(await blob.arrayBuffer()))
    const code = await instance.exec([
      '-fflags', '+genpts',
      '-i', inputName,
      '-map', '0:v:0',
      '-an',
      '-c:v', 'copy',
      '-avoid_negative_ts', 'make_zero',
      '-cluster_time_limit', '1000',
      outputName
    ], 60000)

    if (code !== 0) return blob
    const data = await instance.readFile(outputName)
    return new Blob([toBlobPart(data)], { type: 'video/webm' })
  } catch (error) {
    console.warn('[ffmpeg] remux failed, using recorded webm', error)
    return blob
  } finally {
    await instance.deleteFile(inputName).catch(() => undefined)
    await instance.deleteFile(outputName).catch(() => undefined)
  }
}

async function convertVideoWithMediaRecorder(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<BrowserStickerResult> {
  const { video, url, duration } = await loadVideo(file)
  if (!MediaRecorder.isTypeSupported(MEDIA_RECORDER_MIME)) {
    URL.revokeObjectURL(url)
    video.removeAttribute('src')
    video.load()
    throw new Error('当前浏览器不支持 VP9 WebM 录制，请使用 Chrome/Edge 最新版')
  }
  const outputDuration = Math.min(duration || TELEGRAM_STICKER_LIMITS.maxVideoDuration, TELEGRAM_STICKER_LIMITS.maxVideoDuration)
  const dimensions = getStickerDimensions(video.videoWidth || 512, video.videoHeight || 512)
  const canvas = document.createElement('canvas')
  canvas.width = dimensions.width
  canvas.height = dimensions.height
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('当前浏览器不支持 Canvas 视频预处理')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  const stream = canvas.captureStream(VIDEO_FRAME_FPS)
  const bitrates = [240_000, 180_000, 130_000, 95_000]

  try {
    let bestBlob: Blob | null = null

    for (const bitsPerSecond of bitrates) {
      onProgress?.(8, '正在用浏览器编码 VP9 WebM')
      await seekVideo(video, 0)
      video.playbackRate = 1
      video.muted = true

      const chunks: BlobPart[] = []
      const recorder = new MediaRecorder(stream, {
        mimeType: MEDIA_RECORDER_MIME,
        videoBitsPerSecond: bitsPerSecond
      })
      const recordDone = new Promise<Blob>((resolve, reject) => {
        recorder.ondataavailable = event => {
          if (event.data.size > 0) chunks.push(event.data)
        }
        recorder.onerror = () => reject(new Error('浏览器录制 WEBM 失败'))
        recorder.onstop = () => resolve(new Blob(chunks, { type: MEDIA_RECORDER_MIME }))
      })

      const startedAt = performance.now()
      let rafId = 0
      const draw = () => {
        ctx.drawImage(video, 0, 0, dimensions.width, dimensions.height)
        const elapsed = Math.min((performance.now() - startedAt) / 1000, outputDuration)
        onProgress?.(10 + Math.round((elapsed / outputDuration) * 75), '正在编码 VP9 WebM')
        if (elapsed < outputDuration && !video.ended) {
          rafId = requestAnimationFrame(draw)
        }
      }

      recorder.start(100)
      await video.play()
      draw()
      await wait(Math.ceil(outputDuration * 1000))
      video.pause()
      cancelAnimationFrame(rafId)
      ctx.drawImage(video, 0, 0, dimensions.width, dimensions.height)
      requestRecorderData(recorder)
      if (recorder.state !== 'inactive') recorder.stop()

      const blob = await recordDone
      bestBlob = blob
      if (blob.size <= TELEGRAM_STICKER_LIMITS.maxVideoBytes) break
    }

    if (!bestBlob) throw new Error('没有生成 WEBM 输出')
    bestBlob = await remuxWebmBlob(bestBlob, onProgress)
    const errors = validateTelegramStickerOutput({
      type: 'video',
      size: bestBlob.size,
      width: dimensions.width,
      height: dimensions.height,
      duration: outputDuration
    })
    if (errors.length) throw new Error(errors.join('；'))

    onProgress?.(100, '转换完成')
    return {
      fileName: objectUrlToFileName(file.name, 'webm'),
      blob: bestBlob,
      url: URL.createObjectURL(bestBlob),
      width: dimensions.width,
      height: dimensions.height,
      duration: outputDuration,
      size: bestBlob.size
    }
  } finally {
    stopStream(stream)
    URL.revokeObjectURL(url)
    video.removeAttribute('src')
    video.load()
  }
}

async function renderVideoFrames(
  file: File,
  onProgress?: (progress: number, message: string) => void
) {
  const { video, url, duration } = await loadVideo(file)
  try {
    const outputDuration = Math.min(duration || TELEGRAM_STICKER_LIMITS.maxVideoDuration, TELEGRAM_STICKER_LIMITS.maxVideoDuration)
    const dimensions = getStickerDimensions(video.videoWidth || 512, video.videoHeight || 512)
    const frameCount = Math.max(1, Math.ceil(outputDuration * VIDEO_FRAME_FPS))
    const canvas = document.createElement('canvas')
    canvas.width = dimensions.width
    canvas.height = dimensions.height
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('当前浏览器不支持 Canvas 视频预处理')

    const frames: Blob[] = []
    for (let index = 0; index < frameCount; index++) {
      const time = Math.min(index / VIDEO_FRAME_FPS, Math.max(0, outputDuration - 0.001))
      await seekVideo(video, time)
      ctx.drawImage(video, 0, 0, dimensions.width, dimensions.height)
      frames.push(await canvasToBlob(canvas, 'image/jpeg', VIDEO_FRAME_QUALITY))
      onProgress?.(8 + Math.round(((index + 1) / frameCount) * 32), '正在预处理视频帧')
    }

    return { frames, width: dimensions.width, height: dimensions.height, duration: outputDuration, fps: VIDEO_FRAME_FPS }
  } finally {
    URL.revokeObjectURL(url)
    video.removeAttribute('src')
    video.load()
  }
}

async function readVideoSize(file: File) {
  const { video, url } = await loadVideo(file)
  try {
    return { width: video.videoWidth || 512, height: video.videoHeight || 512 }
  } finally {
    URL.revokeObjectURL(url)
    video.removeAttribute('src')
    video.load()
  }
}

export async function convertImageToTelegramSticker(file: File): Promise<{
  png: BrowserStickerResult
  webp: BrowserStickerResult
}> {
  const source = await createImageBitmap(file)
  const size = getStickerDimensions(source.width, source.height)
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('当前浏览器不支持 Canvas 图片转换')
  ctx.clearRect(0, 0, size.width, size.height)
  ctx.drawImage(source, 0, 0, size.width, size.height)
  source.close()

  const pngBlob = await canvasToBlob(canvas, 'image/png')
  let webpBlob = await canvasToBlob(canvas, 'image/webp', 0.9)
  for (const quality of [0.82, 0.74, 0.66, 0.58]) {
    if (webpBlob.size <= TELEGRAM_STICKER_LIMITS.maxStaticBytes) break
    webpBlob = await canvasToBlob(canvas, 'image/webp', quality)
  }

  const webpErrors = validateTelegramStickerOutput({
    type: 'static',
    size: webpBlob.size,
    width: size.width,
    height: size.height
  })
  if (webpErrors.length) throw new Error(webpErrors.join('；'))

  return {
    png: {
      fileName: objectUrlToFileName(file.name, 'png'),
      blob: pngBlob,
      url: URL.createObjectURL(pngBlob),
      width: size.width,
      height: size.height,
      size: pngBlob.size
    },
    webp: {
      fileName: objectUrlToFileName(file.name, 'webp'),
      blob: webpBlob,
      url: URL.createObjectURL(webpBlob),
      width: size.width,
      height: size.height,
      size: webpBlob.size
    }
  }
}

async function encodeFramesToWebm(
  file: File,
  rendered: Awaited<ReturnType<typeof renderVideoFrames>>,
  onProgress?: (progress: number, message: string) => void
) {
  const instance = await loadStickerFfmpeg(message => onProgress?.(42, message))
  const outputName = `output-${Date.now()}.webm`
  const framePrefix = `frame-${Date.now()}`
  const attempts = [
    { bitrate: '150k', crf: '42' },
    { bitrate: '100k', crf: '48' },
    { bitrate: '72k', crf: '52' }
  ]

  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress?.(45 + Math.min(50, Math.max(0, Math.round(progress * 50))), '正在编码 WEBM')
  }

  instance.on('progress', progressHandler)

  try {
    for (let index = 0; index < rendered.frames.length; index++) {
      const name = `${framePrefix}-${String(index + 1).padStart(4, '0')}.jpg`
      const bytes = new Uint8Array(await rendered.frames[index]!.arrayBuffer())
      await instance.writeFile(name, bytes)
    }

    let outputBlob: Blob | null = null
    for (const attempt of attempts) {
      await instance.deleteFile(outputName).catch(() => undefined)
      const code = await instance.exec([
        '-framerate', String(rendered.fps),
        '-i', `${framePrefix}-%04d.jpg`,
        '-t', String(rendered.duration),
        '-an',
        '-c:v', 'libvpx-vp9',
        '-pix_fmt', 'yuva420p',
        '-b:v', attempt.bitrate,
        '-crf', attempt.crf,
        '-deadline', 'realtime',
        '-cpu-used', '8',
        '-lag-in-frames', '0',
        '-auto-alt-ref', '0',
        outputName
      ], 120000)

      if (code !== 0) throw new Error('ffmpeg.wasm 转换失败')
      const data = await instance.readFile(outputName)
      outputBlob = new Blob([toBlobPart(data)], { type: 'video/webm' })
      if (outputBlob.size <= TELEGRAM_STICKER_LIMITS.maxVideoBytes) break
    }

    if (!outputBlob) throw new Error('没有生成 WEBM 输出')
    const errors = validateTelegramStickerOutput({
      type: 'video',
      size: outputBlob.size,
      width: rendered.width,
      height: rendered.height,
      duration: rendered.duration
    })
    if (errors.length) throw new Error(errors.join('；'))

    return {
      fileName: objectUrlToFileName(file.name, 'webm'),
      blob: outputBlob,
      url: URL.createObjectURL(outputBlob),
      width: rendered.width,
      height: rendered.height,
      duration: rendered.duration,
      size: outputBlob.size
    }
  } finally {
    instance.off('progress', progressHandler)
    await instance.deleteFile(outputName).catch(() => undefined)
    for (let index = 0; index < rendered.frames.length; index++) {
      await instance.deleteFile(`${framePrefix}-${String(index + 1).padStart(4, '0')}.jpg`).catch(() => undefined)
    }
  }
}

async function convertGifWithFfmpeg(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<BrowserStickerResult> {
  const instance = await loadStickerFfmpeg(message => onProgress?.(5, message))
  const { FFFSType } = await import('@ffmpeg/ffmpeg')
  const mountPoint = '/input'
  const inputName = `${stickerBaseName(file.name)}-${Date.now()}${file.name.match(/\.[^.]+$/)?.[0] || '.gif'}`
  const inputFile = new File([file], inputName, { type: file.type })
  const inputPath = `${mountPoint}/${inputName}`
  const outputName = `output-${Date.now()}.webm`

  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress?.(Math.min(95, Math.max(10, Math.round(progress * 85))), '正在转换 GIF')
  }

  instance.on('progress', progressHandler)

  try {
    await instance.createDir(mountPoint).catch(() => undefined)
    await instance.mount(FFFSType.WORKERFS, { files: [inputFile] }, mountPoint)
    const code = await instance.exec([
      '-i', inputPath,
      '-t', String(TELEGRAM_STICKER_LIMITS.maxVideoDuration),
      '-vf', "scale='if(gte(iw,ih),512,-2)':'if(gte(iw,ih),-2,512)',fps=20",
      '-an',
      '-c:v', 'libvpx-vp9',
      '-pix_fmt', 'yuva420p',
      '-b:v', '90k',
      '-crf', '50',
      '-deadline', 'realtime',
      '-cpu-used', '8',
      '-lag-in-frames', '0',
      '-auto-alt-ref', '0',
      outputName
    ], 120000)

    if (code !== 0) throw new Error('ffmpeg.wasm 转换失败')
    const data = await instance.readFile(outputName)
    const blob = new Blob([toBlobPart(data)], { type: 'video/webm' })
    const size = await readVideoSize(new File([blob], outputName, { type: 'video/webm' })).catch(() => ({ width: 512, height: 512 }))
    const errors = validateTelegramStickerOutput({
      type: 'video',
      size: blob.size,
      width: size.width,
      height: size.height,
      duration: TELEGRAM_STICKER_LIMITS.maxVideoDuration
    })
    if (errors.length) throw new Error(errors.join('；'))
    return {
      fileName: objectUrlToFileName(file.name, 'webm'),
      blob,
      url: URL.createObjectURL(blob),
      width: size.width,
      height: size.height,
      duration: TELEGRAM_STICKER_LIMITS.maxVideoDuration,
      size: blob.size
    }
  } finally {
    instance.off('progress', progressHandler)
    await instance.deleteFile(outputName).catch(() => undefined)
    await instance.unmount(mountPoint).catch(() => undefined)
    await instance.deleteDir(mountPoint).catch(() => undefined)
  }
}

export async function convertVideoToTelegramSticker(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<BrowserStickerResult> {
  if (file.size > TELEGRAM_STICKER_LIMITS.maxSourceVideoBytes) {
    throw new Error('源视频超过 50MB，请先裁剪后再转换，避免浏览器内存溢出')
  }

  try {
    if (file.type === 'image/gif') {
      return await convertGifWithFfmpeg(file, onProgress)
    }

    return await convertVideoWithMediaRecorder(file, onProgress)
  } catch (error) {
    console.error('[ffmpeg] convert failed', error)
    if (isMemoryError(error)) {
      resetFfmpeg()
      throw new Error('浏览器内存不足，已重置 ffmpeg。请换更短/更小的视频，或先裁剪到 3 秒以内再试')
    }
    throw error
  }
}
