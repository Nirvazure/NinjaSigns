<script setup lang="ts">
import { watch } from 'vue'
import { navigateTo, useSeoMeta } from '#imports'
import { ArrowUpRight, ScrollText, Users, UserRound } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth'
import { useMastery } from '../composables/useMastery'
import { useNinjaCollection } from '../composables/useNinjaCollection'
import { useCatalog } from '../composables/useCatalog'
import CloudStatus from '../components/CloudStatus.vue'
import CompanionPanel from '../components/CompanionPanel.vue'

useSeoMeta({ title: '个人中心 · 结印修炼场' })
const { auth, player, logout } = useAuth()
const { count } = useMastery()
const { unlockedCount } = useNinjaCollection()
const { catalog, JUTSUS, NINJAS, catalogLoading, catalogError, loadCatalog } = useCatalog()

watch(
  () => [auth.ready, auth.user?.id, auth.busy],
  () => {
    if (auth.ready && !auth.user && !auth.busy)
      void navigateTo({ path: '/login', query: { next: '/account' } }, { replace: true })
  },
  { immediate: true },
)
</script>

<template>
  <section v-if="!auth.ready || !auth.user" class="auth-page" role="status">
    <p>正在恢复账号…</p>
  </section>
  <div v-else class="account-page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">木叶 · 我的修炼档案</p>
        <h1>个人中心</h1>
      </div>
      <NuxtLink to="/" class="quiet-link">继续修炼<ArrowUpRight :size="16" /></NuxtLink>
    </div>
    <section class="account-profile" aria-label="账号信息">
      <img
        v-if="player.state?.avatarUrl"
        class="account-avatar"
        :src="player.state.avatarUrl"
        alt=""
        width="72"
        height="72"
        referrerpolicy="no-referrer"
      />
      <span v-else class="account-avatar account-avatar-placeholder"><UserRound :size="32" /></span>
      <div class="account-identity">
        <p class="eyebrow">GitHub 修炼账号</p>
        <h2>{{ player.state?.displayName || '修炼者' }}</h2>
        <p>一枚印，一步成长。</p>
      </div>
      <button class="secondary-button" :disabled="auth.busy" @click="logout">退出登录</button>
    </section>
    <CloudStatus />
    <template v-if="catalog && player.state">
      <section class="account-stats" aria-label="修炼统计" :aria-busy="player.loading">
        <NuxtLink to="/gallery" class="account-stat" aria-label="查看忍术收藏">
          <ScrollText :size="24" />
          <div>
            <h2>已掌握</h2>
            <p>
              <strong>{{ count }}</strong
              ><span> / {{ JUTSUS.length }}</span>
            </p>
          </div>
          <ArrowUpRight :size="20" />
        </NuxtLink>
        <NuxtLink to="/gallery?tab=ninjas" class="account-stat" aria-label="查看忍者收藏">
          <Users :size="24" />
          <div>
            <h2>忍者</h2>
            <p>
              <strong>{{ unlockedCount }}</strong
              ><span> / {{ NINJAS.length }}</span>
            </p>
          </div>
          <ArrowUpRight :size="20" />
        </NuxtLink>
      </section>
      <CompanionPanel />
    </template>
    <section v-else-if="!catalog" class="account-catalog-status" aria-live="polite">
      <p>{{ catalogLoading ? '正在读取修炼目录…' : catalogError || '修炼目录暂时不可用' }}</p>
      <button v-if="!catalogLoading" class="secondary-button" @click="loadCatalog">
        重新读取目录
      </button>
    </section>
  </div>
</template>
