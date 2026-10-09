export const SEAL_IDS = [
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
] as const
export type SealId = (typeof SEAL_IDS)[number]
export type JutsuId = 'summoning' | 'fireball' | 'chidori'
export type Point = { x: number; y: number }
export type Box = { x: number; y: number; width: number; height: number }
export interface SealDefinition {
  id: SealId
  name: string
  animal: string
  reading: string
  image: string
  hint: string
}
export interface JutsuDefinition {
  id: JutsuId
  name: string
  shortName: string
  category: string
  description: string
  sequence: readonly SealId[]
  color: string
  duration: number
  cover: string
}
export interface RecognitionResult {
  seal: SealId | null
  confidence: number
  box: Box | null
  timestamp: number
  inferenceMs: number
}
export interface CastEvent {
  jutsuId: JutsuId
  anchor: Point
  timestamp: number
}
export type WorkerRequest =
  { type: 'init' } | { type: 'frame'; bitmap: ImageBitmap; timestamp: number }
export type WorkerResponse =
  | { type: 'ready' }
  | { type: 'result'; result: RecognitionResult }
  | { type: 'error'; message: string }
