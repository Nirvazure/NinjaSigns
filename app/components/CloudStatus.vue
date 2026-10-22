<script setup lang="ts">
import { computed } from 'vue'
import { useAuth } from '../composables/useAuth'
const { auth, player } = useAuth()
const emit = defineEmits<{ rewards: [ids: string[]] }>()
const retrying = computed(() => player.saving > 0 || player.loading)
async function retry() {
  emit('rewards', await player.retry())
}
</script>
<template>
  <div class="cloud-status" aria-live="polite">
    <p v-if="auth.error" class="error-message" role="status">登录状态异常：{{ auth.error }}</p>
    <p v-if="!auth.ready || (auth.user && player.loading)">正在加载账号记录…</p>
    <p v-else-if="auth.user && player.saving">正在保存…</p>
    <p v-if="player.error" class="error-message" role="status">
      {{ player.error }}
      <button class="secondary-button" :disabled="retrying" @click="retry">重试保存与读取</button>
    </p>
  </div>
</template>
