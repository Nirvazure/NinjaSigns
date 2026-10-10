import { computed, watch } from 'vue'
import { useState } from '#imports'
import { COMPANION_KEY, getNinjaCollection, resolveCompanion, type NinjaId } from '../domain/ninjas'
import { useMastery } from './useMastery'

export function useNinjaCollection() {
  const { mastery, loaded } = useMastery()
  const selectedId = useState<NinjaId>('ninja-companion', () => 'ninja-01')
  const restored = useState('ninja-companion-restored', () => false)
  const warning = useState('ninja-companion-warning', () => '')
  const entries = computed(() => getNinjaCollection(mastery.value))
  const ready = computed(() => loaded.value && restored.value)
  const selectedNinja = computed(() => resolveCompanion(selectedId.value, mastery.value))

  watch(
    loaded,
    (value) => {
      if (!value || restored.value) return
      restored.value = true
      try {
        const saved = localStorage.getItem(COMPANION_KEY)
        selectedId.value = resolveCompanion(saved, mastery.value).id
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
    warning,
    selectNinja,
    unlockedCount: computed(() => entries.value.filter((entry) => entry.unlocked).length),
  }
}
