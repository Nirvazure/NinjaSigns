import { createServer } from 'vite'
import { chromium } from '@playwright/test'
import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'

export async function browserHarness() {
  const root = resolve(import.meta.dirname, '..')
  const server = await createServer({
    configFile: false,
    root,
    server: { host: '127.0.0.1', port: 0 },
    logLevel: 'error',
    plugins: [
      {
        name: 'validation-entry',
        configureServer(instance) {
          instance.middlewares.use(async (request, response, next) => {
            const pathname = new URL(request.url, 'http://localhost').pathname
            if (pathname === '/') {
              response.setHeader('Content-Type', 'text/html')
              response.end(
                '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>',
              )
              return
            }
            const file = pathname.replace('/runtime/', '')
            if (
              pathname.startsWith('/runtime/') &&
              [
                'ort.wasm.min.mjs',
                'ort-wasm-simd-threaded.mjs',
                'ort-wasm-simd-threaded.wasm',
              ].includes(file)
            ) {
              try {
                const buffer = await readFile(
                  resolve(
                    root,
                    file === 'ort.wasm.min.mjs'
                      ? 'node_modules/onnxruntime-web/dist'
                      : 'public/runtime',
                    file,
                  ),
                )
                response.setHeader(
                  'Content-Type',
                  file.endsWith('.wasm') ? 'application/wasm' : 'text/javascript',
                )
                response.end(buffer)
              } catch (error) {
                next(error)
              }
              return
            }
            next()
          })
        },
      },
    ],
  })
  await server.listen()
  let browser
  try {
    browser = await chromium.launch({
      headless: true,
      channel:
        process.env.PLAYWRIGHT_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined),
    })
  } catch (error) {
    await server.close()
    throw error
  }
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  try {
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`)
  } catch (error) {
    await browser.close()
    await server.close()
    throw error
  }
  return {
    page,
    close: async () => {
      await browser.close()
      await server.close()
    },
  }
}
