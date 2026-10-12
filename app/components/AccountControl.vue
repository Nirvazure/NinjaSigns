<script setup lang="ts">
import { useAuth } from '../composables/useAuth'
import { useRoute } from '#imports'
const { auth, player, logout } = useAuth()
const route = useRoute()
</script>
<template>
  <div class="account-control">
    <span v-if="!auth.ready" role="status">正在恢复账号…</span>
    <template v-else-if="auth.user">
      <img
        v-if="player.state?.avatarUrl"
        :src="player.state.avatarUrl"
        alt=""
        width="32"
        height="32"
        referrerpolicy="no-referrer"
      />
      <span>{{ player.state?.displayName || '忍者' }}</span>
      <button class="text-button" :disabled="auth.busy" @click="logout">退出</button>
    </template>
    <NuxtLink
      v-else
      class="secondary-button"
      :to="{ path: '/login', query: { next: route.fullPath } }"
      >GitHub 登录</NuxtLink
    >
  </div>
</template>
