import { defineNuxtPlugin, useSupabaseClient } from '#imports'
import { reactive, ref, markRaw } from 'vue'
import type { User } from '@supabase/supabase-js'
import { parseCatalog, type Catalog } from '../domain/catalog'
import { parseCastResult, parsePlayerState } from '../domain/cloud-state'
import { clearLegacyStorage } from '../domain/auth'
import { PlayerSession } from '../domain/player-session'
import type { Database } from '../types/database.types'

export default defineNuxtPlugin({
  name: 'dojo',
  dependsOn: ['supabase'],
  setup(nuxtApp) {
    const supabase = useSupabaseClient<Database>()
    const db = supabase.schema('naruto_spiritism')
    const catalog = ref<Catalog | null>(null)
    const catalogLoading = ref(false),
      catalogError = ref('')
    const auth = reactive({ user: null as User | null, ready: false, busy: false, error: '' })
    try {
      clearLegacyStorage(window.localStorage)
    } catch {
      /* Restricted storage is optional. */
    }
    let catalogRequest: Promise<void> | null = null
    async function loadCatalog() {
      if (catalogRequest) return catalogRequest
      catalogRequest = (async () => {
        catalogLoading.value = true
        catalogError.value = ''
        try {
          const { data, error } = await db
            .rpc('get_catalog')
            .abortSignal(AbortSignal.timeout(15000))
          if (error) throw Error(error.message)
          catalog.value = parseCatalog(data)
        } catch (error) {
          catalogError.value = `目录读取失败：${error instanceof Error ? error.message : String(error)}`
        } finally {
          catalogLoading.value = false
          catalogRequest = null
        }
      })()
      return catalogRequest
    }
    const gateway = markRaw({
      async load() {
        if (!catalog.value) await loadCatalog()
        if (!catalog.value) throw Error(catalogError.value)
        const { data, error } = await db.rpc('get_my_state').abortSignal(AbortSignal.timeout(15000))
        if (error) throw Error(error.message)
        return parsePlayerState(data, catalog.value)
      },
      async cast(jutsuId: string, requestId: string) {
        const { data, error } = await db
          .rpc('record_cast', { jutsu_id: jutsuId, request_id: requestId })
          .abortSignal(AbortSignal.timeout(15000))
        if (error) throw Error(error.message)
        return parseCastResult(data, catalog.value!)
      },
      async companion(ninjaId: string) {
        const { data, error } = await db
          .rpc('select_companion', { ninja_id: ninjaId })
          .abortSignal(AbortSignal.timeout(15000))
        if (error) throw Error(error.message)
        return parsePlayerState(data, catalog.value!)
      },
    })
    const player = reactive(new PlayerSession(gateway))
    let authEpoch = 0
    let scheduled: ReturnType<typeof setTimeout> | null = null
    function onSession(user: User | null) {
      const epoch = ++authEpoch
      if (user?.id !== auth.user?.id) {
        auth.user = null
        void player.setAccount(null)
      }
      if (!user) {
        auth.ready = true
        auth.error = ''
        return
      }
      if (auth.user?.id === user.id && auth.ready) return
      auth.ready = false
      // Run SDK calls outside onAuthStateChange's internal session lock.
      if (scheduled) clearTimeout(scheduled)
      scheduled = setTimeout(async () => {
        try {
          const { data, error } = await supabase.auth.getUser()
          if (epoch !== authEpoch) return
          if (error || data.user?.id !== user.id) throw Error(error?.message ?? '登录身份校验失败')
          auth.user = data.user
          auth.error = ''
          await player.setAccount(data.user.id)
        } catch (error) {
          if (epoch === authEpoch) {
            auth.user = null
            await player.setAccount(null)
            auth.error = error instanceof Error ? error.message : String(error)
          }
        } finally {
          if (epoch === authEpoch) auth.ready = true
        }
      }, 0)
    }
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) =>
      onSession(session?.user ?? null),
    )
    void loadCatalog()
    const focus = () => {
      if (auth.ready && auth.user && document.visibilityState === 'visible') void player.refresh()
    }
    window.addEventListener('focus', focus)
    document.addEventListener('visibilitychange', focus)
    nuxtApp.vueApp.onUnmount(() => {
      subscription.subscription.unsubscribe()
      if (scheduled) clearTimeout(scheduled)
      window.removeEventListener('focus', focus)
      document.removeEventListener('visibilitychange', focus)
    })
    return {
      provide: { dojo: { catalog, catalogLoading, catalogError, loadCatalog, auth, player } },
    }
  },
})
