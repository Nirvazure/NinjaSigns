<script setup lang="ts">
import { X, ArrowRight } from 'lucide-vue-next'
import type { NinjaDefinition } from '../domain/ninjas'

defineProps<{ ninjas: readonly NinjaDefinition[] }>()
defineEmits<{ dismiss: [] }>()
</script>

<template>
  <section v-if="ninjas.length" class="ninja-reward" aria-label="新伙伴解锁">
    <div class="ninja-reward-heading">
      <div role="status" aria-live="polite">
        <p class="eyebrow">修炼有所成，伙伴来相伴</p>
        <h2>新伙伴已解锁</h2>
        <p>{{ ninjas.map((ninja) => ninja.name).join('、') }}</p>
      </div>
      <button class="icon-button" aria-label="关闭解锁提示" @click="$emit('dismiss')">
        <X :size="20" />
      </button>
    </div>
    <div class="ninja-reward-portraits">
      <div v-for="ninja in ninjas" :key="ninja.id">
        <img :src="ninja.image" :alt="ninja.name" width="132" height="189" /><span>{{
          ninja.name
        }}</span>
      </div>
    </div>
    <NuxtLink to="/gallery?tab=ninjas" class="quiet-link"
      >前往图鉴选择伙伴<ArrowRight :size="16"
    /></NuxtLink>
  </section>
</template>
