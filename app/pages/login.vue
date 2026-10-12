<script setup lang="ts">
import { useAuth } from '../composables/useAuth'
const { auth, login } = useAuth()
</script>
<template>
  <section class="auth-page">
    <p class="eyebrow">木叶 · 修炼账号</p>
    <h1>让修炼进度跟随你的账号</h1>
    <p>使用与 Artmind、RapperRank 相同的 GitHub 账号登录，在不同设备继续修炼。</p>
    <p>每个账号独立保存忍术进度、忍者收藏和修炼伙伴。</p>
    <button class="primary-button" :disabled="auth.busy || !auth.ready" @click="login()">
      {{ auth.busy ? '正在前往 GitHub…' : '使用 GitHub 登录' }}
    </button>
    <p v-if="auth.error" class="error-message" role="alert">{{ auth.error }}</p>
    <NuxtLink to="/" class="quiet-link">继续游客体验</NuxtLink>
  </section>
</template>
