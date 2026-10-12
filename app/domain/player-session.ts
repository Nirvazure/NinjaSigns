import type { Mastery } from './progress'

export interface PlayerState {
  userId: string
  version: number
  displayName: string
  avatarUrl: string | null
  companionId: string
  mastery: Mastery
  unlockedIds: string[]
}
export interface CastResult {
  state: PlayerState
  newlyUnlocked: string[]
}
export interface PlayerGateway {
  load(): Promise<PlayerState>
  cast(jutsuId: string, requestId: string): Promise<CastResult>
  companion(ninjaId: string): Promise<PlayerState>
}
type Pending = { kind: 'cast' | 'companion'; id: string; requestId: string }

export class PlayerSession {
  userId: string | null = null
  epoch = 0
  loading = false
  saving = 0
  state: PlayerState | null = null
  pending: Pending[] = []
  error = ''
  private delivered = new Set<string>()
  private active = new Set<string>()
  constructor(private gateway: PlayerGateway) {}
  async setAccount(userId: string | null) {
    if (userId === this.userId) return
    this.epoch++
    this.userId = userId
    this.state = null
    this.pending = []
    this.error = ''
    this.saving = 0
    this.loading = false
    this.delivered.clear()
    this.active.clear()
    if (userId) await this.refresh()
  }
  private apply(state: PlayerState, epoch: number) {
    if (epoch !== this.epoch || state.userId !== this.userId) return false
    if (!this.state || state.version >= this.state.version) this.state = state
    return true
  }
  async refresh() {
    if (!this.userId) return
    const epoch = this.epoch
    this.loading = true
    try {
      if (this.apply(await this.gateway.load(), epoch) && !this.pending.length) this.error = ''
    } catch (error) {
      if (epoch === this.epoch) this.error = `账号数据读取失败：${message(error)}`
    } finally {
      if (epoch === this.epoch) this.loading = false
    }
  }
  async recordCast(id: string, requestId: string): Promise<string[]> {
    if (!this.userId) return []
    return this.submit({ kind: 'cast', id, requestId })
  }
  async selectCompanion(id: string) {
    if (!this.userId || !this.state) return
    // A new selection supersedes an unsuccessful older selection.
    this.pending = this.pending.filter((item) => item.kind !== 'companion')
    await this.submit({ kind: 'companion', id, requestId: `companion:${id}` })
  }
  private async submit(item: Pending): Promise<string[]> {
    if (!this.userId || this.active.has(item.requestId)) return []
    const epoch = this.epoch
    this.active.add(item.requestId)
    this.saving++
    try {
      const result =
        item.kind === 'cast'
          ? await this.gateway.cast(item.id, item.requestId)
          : { state: await this.gateway.companion(item.id), newlyUnlocked: [] }
      if (!this.apply(result.state, epoch)) return []
      this.pending = this.pending.filter((pending) => pending.requestId !== item.requestId)
      this.error = this.pending.length ? '还有修炼记录未保存，请重试。' : ''
      if (this.delivered.has(item.requestId)) return []
      this.delivered.add(item.requestId)
      return result.newlyUnlocked
    } catch (error) {
      if (epoch === this.epoch) {
        if (!this.pending.some((pending) => pending.requestId === item.requestId))
          this.pending.push(item)
        this.error = `本次${item.kind === 'cast' ? '修炼记录' : '伙伴选择'}未保存：${message(error)}`
      }
      return []
    } finally {
      if (epoch === this.epoch) {
        this.active.delete(item.requestId)
        this.saving--
      }
    }
  }
  async retry(): Promise<string[]> {
    if (!this.userId) return []
    const rewards: string[] = []
    const epoch = this.epoch
    if (!this.state) await this.refresh()
    for (const item of [...this.pending]) {
      if (epoch !== this.epoch) break
      rewards.push(...(await this.submit(item)))
    }
    return [...new Set(rewards)]
  }
}
function message(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}
