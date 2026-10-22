<script setup lang="ts">
import { Hand, ScrollText, Swords, ArrowUpRight } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoute } from '#imports'
import { useCatalog } from './composables/useCatalog'
import AccountControl from './components/AccountControl.vue'
import BrandIcon from './components/BrandIcon.vue'

const route = useRoute()
const { catalog, catalogLoading, catalogError, loadCatalog } = useCatalog()
const accountPage = computed(() => ['/login', '/auth/callback', '/account'].includes(route.path))
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#main">跳到修炼内容</a>
    <header class="dojo-header">
      <div class="header-inner">
        <NuxtLink to="/" class="brand" aria-label="结印修炼场首页">
          <BrandIcon />
          <span class="brand-text">结印修炼场<small>SHINOBI DOJO</small></span>
        </NuxtLink>
        <nav class="main-nav" aria-label="主导航">
          <NuxtLink
            to="/"
            :class="{ active: route.path === '/' }"
            :aria-current="route.path === '/' ? 'page' : undefined"
            ><span class="nav-number">01</span><Hand :size="18" />修炼场</NuxtLink
          >
          <NuxtLink
            to="/gallery"
            :class="{ active: route.path === '/gallery' }"
            :aria-current="route.path === '/gallery' ? 'page' : undefined"
            ><span class="nav-number">02</span><ScrollText :size="18" />忍术展览馆</NuxtLink
          >
          <span class="future-nav"
            ><Swords :size="18" /><span>双人对战</span><small>筹备中</small></span
          >
        </nav>
        <AccountControl />
      </div>
    </header>
    <main id="main" tabindex="-1">
      <NuxtPage v-if="catalog || accountPage" />
      <section v-else class="auth-page" aria-live="polite">
        <h1>{{ catalogLoading ? '正在读取修炼目录…' : '修炼目录暂时不可用' }}</h1>
        <p v-if="catalogError" role="alert">{{ catalogError }}</p>
        <button v-if="!catalogLoading" class="primary-button" @click="loadCatalog">
          重新读取目录
        </button>
      </section>
    </main>
    <footer class="app-footer">
      <span>结印修炼场 · 非官方同人作品</span>
      <a
        href="https://github.com/Kazuhito00/NARUTO-HandSignDetection"
        target="_blank"
        rel="noopener noreferrer"
        >识别模型来源<ArrowUpRight :size="14"
      /></a>
      <span>影像留在本机 · 心有所向，印有所成</span>
    </footer>
    <NuxtRouteAnnouncer />
  </div>
</template>
