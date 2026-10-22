<script setup lang="ts">
import { useAuth } from '../composables/useAuth'
import { useRoute } from '#imports'
const { auth, player } = useAuth()
const route = useRoute()
</script>
<template>
  <div class="account-control">
    <span v-if="!auth.ready" role="status">正在恢复账号…</span>
    <NuxtLink
      v-else-if="auth.user"
      to="/account"
      class="account-link"
      aria-label="个人中心"
      :aria-current="route.path === '/account' ? 'page' : undefined"
    >
      <img
        v-if="player.state?.avatarUrl"
        :src="player.state.avatarUrl"
        alt=""
        width="32"
        height="32"
        referrerpolicy="no-referrer"
      />
      <span class="account-link-copy"
        ><span>{{ player.state?.displayName || '忍者' }}</span
        ><small>个人中心</small></span
      >
    </NuxtLink>
    <NuxtLink
      v-else
      class="secondary-button"
      :to="{ path: '/login', query: { next: route.fullPath } }"
      >GitHub 登录</NuxtLink
    >
  </div>
</template>
