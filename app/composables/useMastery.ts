import { computed, onMounted } from 'vue'
import { useState } from '#imports'
import { parseMastery, PROGRESS_KEY, type Mastery } from '../domain/progress'
import type { JutsuId } from '../domain/types'

export function useMastery() {
  const mastery = useState<Mastery>('mastery', () => ({}))
  const loaded = useState('mastery-loaded', () => false)
  const warning = useState('mastery-warning', () => '')
  onMounted(() => {
    if (loaded.value) return
    try {
      mastery.value = parseMastery(localStorage.getItem(PROGRESS_KEY))
    } catch (cause) {
      warning.value = `收藏读取失败：${cause instanceof Error ? cause.message : String(cause)}`
    } finally {
      loaded.value = true
    }
  })
  function markMastered(id: JutsuId) {
    mastery.value = {
      ...mastery.value,
      [id]: { casts: (mastery.value[id]?.casts ?? 0) + 1, lastCastAt: new Date().toISOString() },
    }
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(mastery.value))
      warning.value = ''
    } catch (cause) {
      warning.value = `收藏仅保留在本次会话：${cause instanceof Error ? cause.message : String(cause)}`
    }
  }
  return {
    mastery,
    loaded,
    warning,
    count: computed(() => Object.keys(mastery.value).length),
    markMastered,
  }
}
