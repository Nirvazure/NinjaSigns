import { computed } from 'vue'
import { useNuxtApp, useSupabaseClient, useRoute, navigateTo } from '#imports'
import { safeReturnPath } from '../domain/auth'

export function useAuth() {
  const { auth, player } = useNuxtApp().$dojo
  const supabase = useSupabaseClient()
  const route = useRoute()
  async function login(next: unknown = route.query.next) {
    if (auth.busy) return
    auth.busy = true
    auth.error = ''
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeReturnPath(next))}`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo },
      })
      if (error) throw error
    } catch (error) {
      auth.error = error instanceof Error ? error.message : String(error)
    } finally {
      auth.busy = false
    }
  }
  async function logout() {
    if (auth.busy) return
    auth.busy = true
    auth.error = ''
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error) throw error
      auth.user = null
      await player.setAccount(null)
      await navigateTo('/')
    } catch (error) {
      auth.error = error instanceof Error ? error.message : String(error)
    } finally {
      auth.busy = false
    }
  }
  return { auth, player, login, logout, isAuthenticated: computed(() => !!auth.user) }
}
