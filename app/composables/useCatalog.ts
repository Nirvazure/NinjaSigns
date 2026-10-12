import { computed } from 'vue'
import { useNuxtApp } from '#imports'
import type { SealId } from '../domain/types'
export function useCatalog() {
  const store = useNuxtApp().$dojo
  return {
    ...store,
    JUTSUS: computed(() => store.catalog.value?.jutsus ?? []),
    SEALS: computed(() => store.catalog.value?.seals ?? []),
    NINJAS: computed(() => store.catalog.value?.ninjas ?? []),
    getJutsu: (id: string) => store.catalog.value!.jutsus.find((j) => j.id === id)!,
    getSeal: (id: SealId) => store.catalog.value!.seals.find((s) => s.id === id)!,
  }
}
