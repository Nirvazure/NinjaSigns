import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const child = spawn(
  process.execPath,
  [resolve(root, 'node_modules/nuxt/bin/nuxt.mjs'), 'dev', '--host', '127.0.0.1', '--port', '3035'],
  {
    cwd: root,
    env: { ...process.env, NUXT_BUILD_DIR: '.nuxt-mvp', NUXT_IGNORE_LOCK: '1' },
    stdio: 'inherit',
    windowsHide: true,
  },
)
child.on('error', (error) => {
  console.error('Could not start MVP dev server:', error)
  process.exitCode = 1
})
child.on('exit', (code) => {
  process.exitCode = code ?? 1
})
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
