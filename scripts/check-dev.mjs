const baseUrl = process.argv[2] || 'http://127.0.0.1:3035'
const response = await fetch(new URL('/', baseUrl))
const body = await response.text()

if (response.status !== 200) {
  throw new Error(`开发首页返回 ${response.status}: ${body.slice(0, 240)}`)
}

if (body.includes('Either manifest or precomputed data must be provided')) {
  throw new Error('开发首页仍在使用缺失 manifest/precomputed 数据的 renderer')
}

if (!body.includes('<!DOCTYPE html>') && !body.includes('<html')) {
  throw new Error('开发首页未返回 HTML 文档')
}

console.log(`开发首页通过: ${response.status} ${new URL('/', baseUrl).origin}`)
