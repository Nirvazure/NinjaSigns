import { computed } from 'vue'
import { useNuxtApp } from '#imports'
export function useMastery() {
  const { player, auth } = useNuxtApp().$dojo
  const mastery = computed(() => player.state?.mastery ?? {})
  return {
    mastery,
    loaded: computed(() => auth.ready && !player.loading),
    warning: computed(() => player.error),
    count: computed(() => Object.keys(mastery.value).length),
    markMastered: (id: string) => player.recordCast(id, crypto.randomUUID()),
  }
}
