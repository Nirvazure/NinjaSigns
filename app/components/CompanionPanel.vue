<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import { useNinjaCollection } from '../composables/useNinjaCollection'

const { ready, selectedNinja } = useNinjaCollection()
</script>

<template>
  <section class="companion-panel" aria-label="当前修炼伙伴" :aria-busy="!ready">
    <div class="companion-portrait">
      <img :src="selectedNinja.image" :alt="selectedNinja.name" width="132" height="189" />
    </div>
    <div class="companion-copy">
      <p class="eyebrow">当前修炼伙伴</p>
      <h2>{{ selectedNinja.name }}</h2>
      <p>稳住手势，一枚印，一步成长。</p>
      <NuxtLink to="/gallery?tab=ninjas" class="quiet-link"
        >更换伙伴<ArrowRight :size="14"
      /></NuxtLink>
    </div>
  </section>
</template>
