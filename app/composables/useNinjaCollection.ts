import { computed, watch } from 'vue'
import { useState } from '#imports'
import { COMPANION_KEY, getNinjaCollection, resolveCompanion, type NinjaId } from '../domain/ninjas'
import { RETAINED_NINJAS_KEY, restoreRetainedNinjas } from '../domain/ninja-progress'
import { useMastery } from './useMastery'

export function useNinjaCollection() {
  const { mastery, loaded } = useMastery()
  const selectedId = useState<NinjaId>('ninja-companion', () => 'ninja-01')
  const restored = useState('ninja-companion-restored', () => false)
  const warning = useState('ninja-companion-warning', () => '')
  const retainedIds = useState<NinjaId[]>('ninja-retained-unlocks', () => [])
  const entries = computed(() => getNinjaCollection(mastery.value, retainedIds.value))
  const ready = computed(() => loaded.value && restored.value)
  const selectedNinja = computed(() =>
    resolveCompanion(selectedId.value, mastery.value, retainedIds.value),
  )

  watch(
    loaded,
    (value) => {
      if (!value || restored.value) return
      restored.value = true
      retainedIds.value = restoreRetainedNinjas(null, mastery.value)
      try {
        const saved = localStorage.getItem(RETAINED_NINJAS_KEY)
        retainedIds.value = restoreRetainedNinjas(saved, mastery.value)
        if (saved === null)
          localStorage.setItem(RETAINED_NINJAS_KEY, JSON.stringify(retainedIds.value))
      } catch (cause) {
        warning.value = `旧伙伴记录仅保留在本次会话：${cause instanceof Error ? cause.message : String(cause)}`
      }
      try {
        const saved = localStorage.getItem(COMPANION_KEY)
        selectedId.value = resolveCompanion(saved, mastery.value, retainedIds.value).id
        if (saved && saved !== selectedId.value) warning.value = '伙伴记录无效，已切换为鸣人。'
      } catch (cause) {
        warning.value = `伙伴读取失败：${cause instanceof Error ? cause.message : String(cause)}`
      }
    },
    { immediate: true, flush: 'sync' },
  )

  function selectNinja(id: NinjaId) {
    if (!ready.value || !entries.value.some((entry) => entry.ninja.id === id && entry.unlocked))
      return
    selectedId.value = id
    try {
      localStorage.setItem(COMPANION_KEY, id)
      warning.value = ''
    } catch (cause) {
      warning.value = `伙伴仅保留在本次会话：${cause instanceof Error ? cause.message : String(cause)}`
    }
  }

  return {
    entries,
    ready,
    selectedNinja,
    retainedIds,
    warning,
    selectNinja,
    unlockedCount: computed(() => entries.value.filter((entry) => entry.unlocked).length),
  }
}
