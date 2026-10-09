import { describe, expect, it } from 'vitest'
import { decodeDetections, mirrorPoint, preprocessPixels } from '../../app/recognition/yolox'

describe('YOLOX frame processing', () => {
  it('converts RGBA to unnormalized BGR planes', () => {
    const tensor = preprocessPixels(new Uint8ClampedArray([10, 20, 30, 255]), 1, 1, 2)
    expect(Array.from(tensor)).toEqual([30, 114, 114, 114, 20, 114, 114, 114, 10, 114, 114, 114])
  })
  it('mirrors the normalized display anchor exactly once', () => {
    expect(mirrorPoint({ x: 0.2, y: 0.6 })).toEqual({ x: 0.8, y: 0.6 })
  })
  it('maps class zero to rat and restores the padded box', () => {
    const rows = new Float32Array(3549 * 19)
    const offset = (20 * 52 + 20) * 19
    rows.set([0, 0, Math.log(8), Math.log(8), 0.9, 0.9], offset)
    const result = decodeDetections(rows, 19, 640, 480)
    expect(result[0]?.seal).toBe('rat')
    expect(result[0]?.box.x).toBeCloseTo(128 / 416)
  })
  it('does not remap an unsupported class into a valid seal', () => {
    const rows = new Float32Array(3549 * 19)
    rows[4] = 0.99
    rows[17] = 0.99
    expect(decodeDetections(rows, 19, 640, 480)[0]?.seal).toBeNull()
  })
  it('suppresses overlapping lower-scoring boxes', () => {
    const rows = new Float32Array(3549 * 19)
    rows.set([10, 10, 2, 2, 0.99, 0.99], 0)
    rows.set([9, 10, 2, 2, 0.9, 0.9], 19)
    expect(decodeDetections(rows, 19, 640, 480)).toHaveLength(1)
  })
})
