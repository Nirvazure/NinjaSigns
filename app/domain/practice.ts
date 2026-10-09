import type { SealId } from './types'

export class SealStabilizer {
  private candidate: SealId | null = null
  private candidateSince = 0
  private committed: SealId | null = null
  private releaseSince: number | null = null

  reset() {
    this.candidate = null
    this.committed = null
    this.releaseSince = null
  }

  push(seal: SealId | null, confidence: number, now: number): SealId | null {
    if (!seal || confidence < 0.7) {
      this.candidate = null
      this.releaseSince ??= now
      if (now - this.releaseSince >= 200) this.committed = null
      return null
    }
    this.releaseSince = null
    if (seal !== this.candidate) {
      this.candidate = seal
      this.candidateSince = now
      return null
    }
    if (seal === this.committed || now - this.candidateSince < 300) return null
    this.committed = seal
    return seal
  }
}

export class SequenceMatcher {
  step = 0
  phase: 'ready' | 'casting' | 'release' = 'ready'
  private lastProgress = 0

  constructor(readonly sequence: readonly SealId[]) {}

  reset() {
    this.step = 0
    this.phase = 'ready'
    this.lastProgress = 0
  }
  tick(now: number): boolean {
    if (this.phase === 'ready' && this.step > 0 && now - this.lastProgress >= 10000) {
      this.step = 0
      return true
    }
    return false
  }
  push(seal: SealId, now: number): 'progress' | 'wrong' | 'complete' | 'blocked' {
    if (this.phase !== 'ready') return 'blocked'
    this.tick(now)
    if (seal !== this.sequence[this.step]) return 'wrong'
    this.step++
    this.lastProgress = now
    if (this.step === this.sequence.length) {
      this.phase = 'casting'
      return 'complete'
    }
    return 'progress'
  }
  finishCast() {
    if (this.phase === 'casting') {
      this.phase = 'release'
      this.step = 0
    }
  }
  release() {
    if (this.phase === 'release') this.phase = 'ready'
  }
}
