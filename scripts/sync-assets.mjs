import { readFile, writeFile, mkdir, copyFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const provenancePath = resolve(root, 'public/models/provenance.json')
let revision
try {
  revision = JSON.parse(await readFile(provenancePath, 'utf8')).revision
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
if (!revision) {
  const response = await fetch(
    'https://api.github.com/repos/Kazuhito00/NARUTO-HandSignDetection/commits/main',
    { headers: { 'User-Agent': 'naruto-spiritism-mvp' } },
  )
  if (!response.ok) throw new Error(`Cannot resolve model revision: ${response.status}`)
  revision = (await response.json()).sha
}
const source = `https://raw.githubusercontent.com/Kazuhito00/NARUTO-HandSignDetection/${revision}`
const readme = await (await fetch(`${source}/README.md`)).text()
const images = [...readme.matchAll(/<td><img src="([^"]+\.jpg)"/g)]
  .slice(0, 12)
  .map((match) => match[1])
const seals = [
  'rat',
  'ox',
  'tiger',
  'hare',
  'dragon',
  'snake',
  'horse',
  'ram',
  'monkey',
  'bird',
  'dog',
  'boar',
]
if (images.length !== 12) throw new Error('Expected twelve ordered seal reference images')
const downloads = [
  { url: `${source}/model/yolox/yolox_nano.onnx`, path: 'public/models/yolox_nano.onnx' },
  { url: `${source}/LICENSE`, path: 'public/models/LICENSE.txt' },
  ...images.map((url, i) => ({ url, path: `public/images/seals/${seals[i]}.jpg` })),
]
const records = []
for (const item of downloads) {
  const response = await fetch(item.url)
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${item.url}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  await mkdir(dirname(resolve(root, item.path)), { recursive: true })
  await writeFile(resolve(root, item.path), buffer)
  records.push({
    ...item,
    bytes: buffer.length,
    sha256: createHash('sha256').update(buffer).digest('hex'),
  })
  console.log(`Downloaded ${item.path} (${buffer.length} bytes)`)
}
await writeFile(
  provenancePath,
  JSON.stringify(
    { repository: 'Kazuhito00/NARUTO-HandSignDetection', revision, records },
    null,
    2,
  ) + '\n',
)
const runtime = resolve(root, 'node_modules/onnxruntime-web/dist')
await mkdir(resolve(root, 'public/runtime'), { recursive: true })
for (const file of await readdir(runtime)) {
  if (/^ort-wasm-simd-threaded\.(mjs|wasm)$/.test(file))
    await copyFile(resolve(runtime, file), resolve(root, 'public/runtime', file))
}
console.log(`Assets pinned to ${revision}`)
