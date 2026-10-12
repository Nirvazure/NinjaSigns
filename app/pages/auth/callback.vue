<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, navigateTo } from '#imports'
import { useAuth } from '../../composables/useAuth'
import { safeReturnPath } from '../../domain/auth'
const { auth, player } = useAuth()
const route = useRoute()
const expired = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  timer = setTimeout(() => {
    expired.value = true
  }, 20000)
})
onBeforeUnmount(() => {
  clearTimeout(timer)
})
watch(
  () => [auth.ready, auth.user?.id, player.loading, player.state?.userId],
  () => {
    if (auth.ready && auth.user && !player.loading && player.state?.userId === auth.user.id)
      void navigateTo(safeReturnPath(route.query.next), { replace: true })
  },
  { immediate: true },
)
</script>
<template>
  <section class="auth-page">
    <h1>
      {{
        auth.error || route.query.error || expired || player.error
          ? '登录未完成'
          : '正在完成 GitHub 登录…'
      }}
    </h1>
    <p role="status">
      {{
        auth.error ||
        player.error ||
        (route.query.error
          ? 'GitHub 授权未完成，请重试。'
          : expired
            ? '未能获取完整登录信息，请重试。'
            : '正在校验账号并读取修炼记录。')
      }}
    </p>
    <button v-if="player.error" class="secondary-button" @click="player.refresh()">
      重新读取账号记录
    </button>
    <NuxtLink v-if="auth.error || route.query.error || expired" to="/login" class="primary-button"
      >重新登录</NuxtLink
    >
  </section>
</template>
