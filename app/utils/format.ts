export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function formatDayLabel(dateKey: string, locale: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  if (!year || !month || !day) return dateKey
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

export function groupByDay<T extends { timestamp: number }>(items: T[]): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const date = new Date(item.timestamp)
    const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {} as Record<string, T[]>)
}
