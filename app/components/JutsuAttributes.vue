<script setup lang="ts">
import { computed, type Component } from 'vue'
import { Wind, Zap, Droplets, Flame, Mountain, ScrollText, Swords } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{ category: string; attackPower: number; variant?: 'compact' | 'scroll' }>(),
  { variant: 'compact' },
)
const elementIcons: Readonly<Record<string, Component | undefined>> = {
  风遁: Wind,
  雷遁: Zap,
  水遁: Droplets,
  火遁: Flame,
  土遁: Mountain,
}
const elementIcon = computed(() => elementIcons[props.category] ?? ScrollText)
</script>

<template>
  <span class="jutsu-attributes" :class="variant">
    <span class="jutsu-element" :data-element="category">
      <span class="jutsu-nature-mark" aria-hidden="true">
        <component :is="elementIcon" :size="variant === 'scroll' ? 25 : 15" :stroke-width="1.7" />
      </span>
      <span class="jutsu-nature-copy">
        <small v-if="variant === 'scroll'">{{
          elementIcons[category] ? '查克拉属性' : '忍术类型'
        }}</small>
        <strong>{{ category }}</strong>
      </span>
    </span>
    <span class="jutsu-attack">
      <span class="jutsu-attack-label"><Swords :size="14" aria-hidden="true" />攻击力</span>
      <b>{{ attackPower }}</b>
      <span v-if="variant === 'scroll'" class="jutsu-power-track" aria-hidden="true">
        <i
          v-for="segment in 5"
          :key="segment"
          :class="{ filled: attackPower > (segment - 1) * 20 }"
        />
      </span>
      <small v-if="variant === 'scroll' && attackPower === 0" class="jutsu-support-label"
        >无直接伤害</small
      >
    </span>
  </span>
</template>
