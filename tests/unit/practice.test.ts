import { describe, expect, it } from 'vitest'
import { SealStabilizer, SequenceMatcher } from '../../app/domain/practice'
import { JUTSUS } from '../../supabase/seed/catalog'

describe('stable seal confirmation', () => {
  it('requires a continuous 300ms confident hold', () => {
    const gate = new SealStabilizer()
    gate.push('boar', 0.9, 0)
    expect(gate.push('boar', 0.9, 299)).toBeNull()
    expect(gate.push('boar', 0.9, 300)).toBe('boar')
  })
  it('only confirms a held seal once', () => {
    const gate = new SealStabilizer()
    gate.push('boar', 0.9, 0)
    gate.push('boar', 0.9, 300)
    expect(gate.push('boar', 0.9, 3000)).toBeNull()
  })
  it('requires 200ms of release before repeating the same seal', () => {
    const gate = new SealStabilizer()
    gate.push('boar', 0.9, 0)
    gate.push('boar', 0.9, 300)
    gate.push(null, 0, 400)
    gate.push(null, 0, 600)
    gate.push('boar', 0.9, 700)
    expect(gate.push('boar', 0.9, 1000)).toBe('boar')
  })
  it('does not let a brief low-confidence frame rearm a held seal', () => {
    const gate = new SealStabilizer()
    gate.push('boar', 0.9, 0)
    gate.push('boar', 0.9, 300)
    gate.push(null, 0, 400)
    gate.push('boar', 0.9, 450)
    expect(gate.push('boar', 0.9, 800)).toBeNull()
  })
  it('resets stability when confidence falls below 0.7', () => {
    const gate = new SealStabilizer()
    gate.push('tiger', 0.9, 0)
    gate.push('tiger', 0.6, 250)
    expect(gate.push('tiger', 0.9, 300)).toBeNull()
  })
})

describe('guided sequences', () => {
  for (const jutsu of JUTSUS) {
    it(`casts ${jutsu.id} after the complete configured sequence`, () => {
      const matcher = new SequenceMatcher(jutsu.sequence)
      const results = jutsu.sequence.map((seal, i) => matcher.push(seal, i * 500))
      expect(results.at(-1)).toBe('complete')
    })
  }
  it('keeps the current step after a wrong seal', () => {
    const matcher = new SequenceMatcher(['boar', 'dog'])
    matcher.push('boar', 0)
    matcher.push('tiger', 100)
    expect(matcher.step).toBe(1)
  })
  it('resets after ten seconds without effective progress', () => {
    const matcher = new SequenceMatcher(['boar', 'dog'])
    matcher.push('boar', 100)
    matcher.push('tiger', 9000)
    matcher.tick(10100)
    expect(matcher.step).toBe(0)
  })
  it('ignores input during the cast and waits for release afterward', () => {
    const matcher = new SequenceMatcher(['boar'])
    matcher.push('boar', 0)
    matcher.finishCast()
    expect(matcher.push('boar', 1000)).toBe('blocked')
    matcher.release()
    expect(matcher.push('boar', 1300)).toBe('complete')
  })
})
