import { config } from '../utils/config'

export default defineEventHandler(() => {
  return {
    upload: {
      maxFileSize: config.upload.maxFileSize,
      maxImageFiles: config.upload.maxImageFiles,
      maxVideoFiles: config.upload.maxVideoFiles
    },
    sticker: {
      maxStaticFileSize: config.sticker.maxStaticFileSize,
      maxVideoFileSize: config.sticker.maxVideoFileSize,
      maxVideoDuration: config.sticker.maxVideoDuration
    }
  }
})
