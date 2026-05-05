export function setNoStoreHeaders(event: any) {
  event.node.res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
  event.node.res.setHeader('Pragma', 'no-cache')
  event.node.res.setHeader('Expires', '0')
  event.node.res.setHeader('CDN-Cache-Control', 'no-store')
  event.node.res.setHeader('Vercel-CDN-Cache-Control', 'no-store')
}

