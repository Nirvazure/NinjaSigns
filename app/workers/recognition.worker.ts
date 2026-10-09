import * as ort from 'onnxruntime-web/wasm'
import { decodeDetections, preprocessPixels } from '../recognition/yolox'
import type { WorkerRequest, WorkerResponse } from '../domain/types'

const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null
  postMessage: (message: WorkerResponse) => void
  location: Location
}
let session: ort.InferenceSession | null = null
const canvas = new OffscreenCanvas(416, 416)
const context = canvas.getContext('2d', { willReadFrequently: true })!

scope.onmessage = async ({ data }) => {
  try {
    if (data.type === 'init') {
      ort.env.wasm.wasmPaths = new URL('/runtime/', scope.location.origin).href
      ort.env.wasm.numThreads = 1
      ort.env.wasm.proxy = false
      session = await ort.InferenceSession.create('/models/yolox_nano.onnx', {
        executionProviders: ['wasm'],
      })
      scope.postMessage({ type: 'ready' })
      return
    }
    if (!session) throw new Error('识别模型尚未准备好')
    const started = performance.now()
    const { bitmap, timestamp } = data
    const width = bitmap.width
    const height = bitmap.height
    const ratio = Math.min(416 / width, 416 / height)
    const resizedWidth = Math.floor(width * ratio)
    const resizedHeight = Math.floor(height * ratio)
    context.clearRect(0, 0, 416, 416)
    context.drawImage(bitmap, 0, 0, resizedWidth, resizedHeight)
    bitmap.close()
    const pixels = context.getImageData(0, 0, resizedWidth, resizedHeight).data
    const tensor = new ort.Tensor(
      'float32',
      preprocessPixels(pixels, resizedWidth, resizedHeight),
      [1, 3, 416, 416],
    )
    const outputs = await session.run({ [session.inputNames[0]!]: tensor })
    const output = outputs[session.outputNames[0]!]!
    const detections = decodeDetections(
      output.data as Float32Array,
      output.dims.at(-1)!,
      width,
      height,
    )
    const best = detections[0]
    scope.postMessage({
      type: 'result',
      result: {
        seal: best?.seal ?? null,
        confidence: best?.confidence ?? 0,
        box: best?.box ?? null,
        timestamp,
        inferenceMs: performance.now() - started,
      },
    })
  } catch (error) {
    if (data.type === 'frame') data.bitmap.close()
    scope.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
