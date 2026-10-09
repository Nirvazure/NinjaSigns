import { SEAL_IDS, type Box, type Point, type SealId } from '../domain/types'

export interface Detection {
  seal: SealId | null
  confidence: number
  box: Box
  classId: number
}

export function mirrorPoint(point: Point): Point {
  return { x: 1 - point.x, y: point.y }
}

// The upstream model expects byte-range BGR in CHW order, padded at bottom/right.
export function preprocessPixels(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  size = 416,
): Float32Array {
  const plane = size * size
  const tensor = new Float32Array(plane * 3).fill(114)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const source = (y * width + x) * 4
      const target = y * size + x
      tensor[target] = pixels[source + 2]!
      tensor[target + plane] = pixels[source + 1]!
      tensor[target + plane * 2] = pixels[source]!
    }
  }
  return tensor
}

function iou(a: Box, b: Box): number {
  const w = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
  const h = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))
  const intersection = w * h
  return intersection / Math.max(1e-9, a.width * a.height + b.width * b.height - intersection)
}

export function decodeDetections(
  data: Float32Array,
  columns: number,
  width: number,
  height: number,
  size = 416,
): Detection[] {
  const ratio = Math.min(size / width, size / height)
  const detections: Detection[] = []
  let row = 0
  for (const stride of [8, 16, 32]) {
    const cells = size / stride
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++, row++) {
        const offset = row * columns
        const objectness = data[offset + 4] ?? 0
        if (objectness < 0.1) continue
        let classId = 0
        let classScore = 0
        for (let c = 5; c < columns; c++) {
          if (data[offset + c]! > classScore) {
            classScore = data[offset + c]!
            classId = c - 5
          }
        }
        const confidence = objectness * classScore
        if (confidence < 0.1) continue
        const cx = ((data[offset]! + x) * stride) / ratio
        const cy = ((data[offset + 1]! + y) * stride) / ratio
        const bw = (Math.exp(data[offset + 2]!) * stride) / ratio
        const bh = (Math.exp(data[offset + 3]!) * stride) / ratio
        const x1 = Math.max(0, Math.min(width, cx - bw / 2))
        const y1 = Math.max(0, Math.min(height, cy - bh / 2))
        const x2 = Math.max(0, Math.min(width, cx + bw / 2))
        const y2 = Math.max(0, Math.min(height, cy + bh / 2))
        const box = {
          x: x1 / width,
          y: y1 / height,
          width: (x2 - x1) / width,
          height: (y2 - y1) / height,
        }
        if (box.width <= 0 || box.height <= 0) continue
        detections.push({ seal: SEAL_IDS[classId] ?? null, confidence, box, classId })
      }
    }
  }
  detections.sort((a, b) => b.confidence - a.confidence)
  const kept: Detection[] = []
  for (const detection of detections) {
    if (!kept.some((previous) => iou(previous.box, detection.box) > 0.45)) kept.push(detection)
  }
  return kept
}
