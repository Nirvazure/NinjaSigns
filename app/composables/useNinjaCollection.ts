import { computed } from 'vue'
import { useNuxtApp } from '#imports'
import { getNinjaCollection } from '../domain/ninjas'
export function useNinjaCollection() {
  const { catalog, player, auth } = useNuxtApp().$dojo
  const entries = computed(() =>
    catalog.value
      ? getNinjaCollection(
          catalog.value,
          player.state?.mastery ?? {},
          player.state?.unlockedIds ?? ['ninja-01'],
        )
      : [],
  )
  return {
    entries,
    ready: computed(() => !!catalog.value && auth.ready && !player.loading),
    canSelect: computed(() => !!player.state && player.saving === 0),
    selectedNinja: computed(() =>
      catalog.value!.ninjas.find((n) => n.id === (player.state?.companionId ?? 'ninja-01'))!,
    ),
    warning: computed(() => player.error),
    selectNinja: (id: string) => player.selectCompanion(id),
    unlockedCount: computed(() => entries.value.filter((entry) => entry.unlocked).length),
  }
}
