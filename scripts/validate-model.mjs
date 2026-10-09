import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { browserHarness } from './browser-harness.mjs'

const harness = await browserHarness()
try {
  const results = await harness.page.evaluate(async () => {
    const ort = await import('/runtime/ort.wasm.min.mjs')
    const { preprocessPixels, decodeDetections } = await import('/app/recognition/yolox.ts')
    ort.env.wasm.wasmPaths = '/runtime/'
    ort.env.wasm.numThreads = 1
    const session = await ort.InferenceSession.create('/models/yolox_nano.onnx', {
      executionProviders: ['wasm'],
    })
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
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 416
    const context = canvas.getContext('2d', { willReadFrequently: true })
    const results = []
    for (const expected of seals) {
      const image = new Image()
      image.src = `/images/seals/${expected}.jpg`
      await image.decode()
      const ratio = Math.min(416 / image.width, 416 / image.height)
      const width = Math.floor(image.width * ratio)
      const height = Math.floor(image.height * ratio)
      context.clearRect(0, 0, 416, 416)
      context.drawImage(image, 0, 0, width, height)
      const pixels = context.getImageData(0, 0, width, height).data
      const input = new ort.Tensor(
        'float32',
        preprocessPixels(pixels, width, height),
        [1, 3, 416, 416],
      )
      const started = performance.now()
      const outputs = await session.run({ [session.inputNames[0]]: input })
      const output = outputs[session.outputNames[0]]
      const detections = decodeDetections(
        output.data,
        output.dims.at(-1),
        image.width,
        image.height,
      )
      const best = detections[0]
      results.push({
        expected,
        predicted: best?.seal ?? null,
        confidence: best?.confidence ?? 0,
        inferenceMs: Math.round(performance.now() - started),
        shape: output.dims,
        box: best?.box ?? null,
      })
    }
    return results
  })
  const root = resolve(import.meta.dirname, '..')
  const provenance = JSON.parse(
    await readFile(resolve(root, 'public/models/provenance.json'), 'utf8'),
  )
  const report = {
    revision: provenance.revision,
    sampleType: 'Upstream annotated demonstration images; not an independent accuracy benchmark.',
    webcamTest: 'Not performed; requires a human and physical camera.',
    results,
  }
  await mkdir(resolve(root, 'docs/validation'), { recursive: true })
  await writeFile(
    resolve(root, 'docs/validation/model-reference-results.json'),
    JSON.stringify(report, null, 2) + '\n',
  )
  console.table(
    results.map(({ expected, predicted, confidence, inferenceMs }) => ({
      expected,
      predicted,
      confidence: confidence.toFixed(3),
      inferenceMs,
    })),
  )
  const matches = results.filter(
    (result) => result.expected === result.predicted && result.confidence >= 0.7,
  ).length
  console.log(
    `Reference smoke check: ${matches}/12 matched at the application threshold. This is not webcam accuracy.`,
  )
} finally {
  await harness.close()
}
