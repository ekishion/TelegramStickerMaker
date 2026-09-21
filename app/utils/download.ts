/**
 * Programmatic single-file download. Shared by every queue/download path so the
 * anchor wiring (and its cleanup) lives in one place.
 */
export function triggerDownload(url: string, fileName: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.rel = 'noopener'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
}
