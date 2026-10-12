import { SEAL_IDS, type JutsuDefinition, type SealDefinition, type SealId } from './types'
import type { NinjaDefinition, NinjaUnlock } from './ninjas'

export interface Catalog {
  seals: SealDefinition[]
  jutsus: JutsuDefinition[]
  ninjas: NinjaDefinition[]
}
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('云端数据格式无效')
  return value as Record<string, unknown>
}
export function text(value: unknown): string {
  if (typeof value !== 'string' || !value.length) throw Error('云端文本数据无效')
  return value
}
export function integer(value: unknown, min = 0): number {
  if (!Number.isSafeInteger(value) || (value as number) < min) throw Error('云端数值无效')
  return value as number
}
export function list(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw Error('云端列表无效')
  return value
}
function unique(rows: { id: string }[]) {
  if (new Set(rows.map((row) => row.id)).size !== rows.length) throw Error('目录 ID 重复')
}
export function parseCatalog(raw: unknown): Catalog {
  const data = object(raw)
  const seals = list(data.seals).map((raw) => {
    const s = object(raw),
      id = text(s.id)
    if (!SEAL_IDS.includes(id as SealId)) throw Error('结印与识别模型不兼容')
    return {
      id: id as SealId,
      name: text(s.name),
      animal: text(s.animal),
      reading: text(s.reading),
      image: text(s.image),
      hint: text(s.hint),
    }
  })
  unique(seals)
  if (seals.length !== SEAL_IDS.length) throw Error('结印目录不完整')
  const jutsus: JutsuDefinition[] = list(data.jutsus).map((raw) => {
    const j = object(raw)
    const sequence = list(j.sequence).map((value) => {
      if (!SEAL_IDS.includes(value as SealId)) throw Error('忍术结印无效')
      return value as SealId
    })
    if (
      !sequence.length ||
      ![null, 'summoning', 'fireball', 'chidori'].includes(j.effect as string | null)
    )
      throw Error('忍术配置无效')
    const attackPower = integer(j.attackPower)
    if (attackPower > 100) throw Error('攻击力无效')
    return {
      id: text(j.id),
      name: text(j.name),
      shortName: text(j.shortName),
      category: text(j.category),
      description: text(j.description),
      attackPower,
      sequence,
      color: text(j.color),
      duration: integer(j.duration),
      cover: text(j.cover),
      effect: j.effect as JutsuDefinition['effect'],
    }
  })
  unique(jutsus)
  if (!jutsus.length) throw Error('忍术目录为空')
  const hasJutsu = (id: unknown) => {
    const value = text(id)
    if (!jutsus.some((j) => j.id === value)) throw Error('解锁规则引用了不存在的忍术')
    return value
  }
  const ninjas: NinjaDefinition[] = list(data.ninjas).map((raw) => {
    const n = object(raw),
      rule = object(n.unlock)
    let unlock: NinjaUnlock
    if (rule.kind === 'starter') unlock = { kind: 'starter' }
    else if (rule.kind === 'first-cast')
      unlock = { kind: 'first-cast', jutsuId: hasJutsu(rule.jutsuId) }
    else if (rule.kind === 'jutsu-set') {
      const ids = list(rule.jutsuIds).map(hasJutsu)
      if (!ids.length || new Set(ids).size !== ids.length) throw Error('忍术组合无效')
      unlock = { kind: 'jutsu-set', jutsuIds: ids }
    } else if (rule.kind === 'mastered-count')
      unlock = { kind: 'mastered-count', required: integer(rule.required, 1) }
    else throw Error('解锁规则无效')
    return { id: text(n.id), name: text(n.name), image: text(n.image), unlock }
  })
  unique(ninjas)
  if (!ninjas.some((n) => n.id === 'ninja-01' && n.unlock.kind === 'starter'))
    throw Error('初始伙伴缺失')
  return { seals, jutsus, ninjas }
}
