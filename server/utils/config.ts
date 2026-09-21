export const config = {
  upload: {
    maxFileSize: 52428800,
    maxImageFiles: 200,
    maxVideoFiles: 100,
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm'
    ]
  },
  sticker: {
    maxStaticFileSize: 512 * 1024,
    maxVideoFileSize: 256 * 1024,
    maxSide: 512,
    maxVideoDuration: 3
  }
}
