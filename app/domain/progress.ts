import type { JutsuId } from './types'
import { JUTSU_IDS } from './jutsu-data'

export type Mastery = Partial<Record<JutsuId, { casts: number; lastCastAt: string }>>
export const PROGRESS_KEY = 'naruto-spiritism.progress.v1'

export function parseMastery(raw: string | null): Mastery {
  if (!raw) return {}
  const parsed: unknown = JSON.parse(raw)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
    throw new Error('收藏记录格式无效')
  const result: Mastery = {}
  for (const id of JUTSU_IDS) {
    const record = (parsed as Record<string, unknown>)[id]
    if (record === undefined) continue
    if (
      !record ||
      typeof record !== 'object' ||
      Array.isArray(record) ||
      !('casts' in record) ||
      !('lastCastAt' in record) ||
      !Number.isSafeInteger(record.casts) ||
      (record.casts as number) < 1 ||
      typeof record.lastCastAt !== 'string' ||
      Number.isNaN(Date.parse(record.lastCastAt))
    )
      throw new Error('收藏记录内容无效')
    result[id] = { casts: record.casts as number, lastCastAt: record.lastCastAt }
  }
  return result
}
