<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from '#imports'
import { useAuth } from '../composables/useAuth'
const { auth, player } = useAuth()
const route = useRoute()
const emit = defineEmits<{ rewards: [ids: string[]] }>()
const retrying = computed(() => player.saving > 0 || player.loading)
async function retry() {
  emit('rewards', await player.retry())
}
</script>
<template>
  <div class="cloud-status" aria-live="polite">
    <p v-if="auth.error" class="error-message" role="status">登录状态异常：{{ auth.error }}</p>
    <p v-if="!auth.user && auth.ready">
      游客体验 · 登录后保存修炼进度、解锁忍者与选择伙伴。<NuxtLink
        :to="{ path: '/login', query: { next: route.fullPath } }"
        >使用 GitHub 登录</NuxtLink
      >
    </p>
    <p v-else-if="!auth.ready || player.loading">正在加载账号记录…</p>
    <p v-else-if="player.saving">正在保存…</p>
    <p v-if="player.error" class="error-message" role="status">
      {{ player.error }}
      <button class="secondary-button" :disabled="retrying" @click="retry">重试保存与读取</button>
    </p>
  </div>
</template>
