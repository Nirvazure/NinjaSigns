<script setup lang="ts">
import { Check, ScrollText, Hand, ArrowUpRight, Eye } from 'lucide-vue-next'
import { getSeal } from '../domain/catalog'
import type { JutsuDefinition } from '../domain/types'
import JutsuAttributes from './JutsuAttributes.vue'

defineProps<{ jutsu: JutsuDefinition; index: number; mastered: boolean }>()
defineEmits<{ preview: [jutsu: JutsuDefinition] }>()
</script>

<template>
  <article class="jutsu-card" :data-jutsu="jutsu.id" :data-category="jutsu.category">
    <header class="jutsu-cover" :class="{ placeholder: !jutsu.effect }">
      <img
        v-if="jutsu.effect"
        class="jutsu-cover-art"
        :src="jutsu.cover"
        alt=""
        width="640"
        height="400"
        :loading="index < 3 ? 'eager' : 'lazy'"
        aria-hidden="true"
      />
      <div class="jutsu-card-meta">
        <span class="jutsu-archive-number"
          ><ScrollText :size="14" aria-hidden="true" />忍术之卷 ·
          {{ String(index + 1).padStart(2, '0') }}</span
        >
        <span class="mastery-badge" :class="{ mastered }">
          <Check v-if="mastered" :size="12" aria-hidden="true" />{{
            mastered ? '已掌握' : '未掌握'
          }}
        </span>
      </div>
      <span class="cover-glyph" aria-hidden="true">{{
        jutsu.id === 'summoning' ? '契' : jutsu.category[0] || '忍'
      }}</span>
      <h2 class="cover-title">{{ jutsu.shortName }}</h2>
      <span class="jutsu-cover-caption" aria-hidden="true">忍术秘卷 · 结印修行</span>
    </header>
    <div class="jutsu-card-body">
      <JutsuAttributes
        :category="jutsu.category"
        :attack-power="jutsu.attackPower"
        variant="scroll"
      />
      <p class="jutsu-description">{{ jutsu.description }}</p>
      <section class="jutsu-seal-scroll" :aria-label="`${jutsu.shortName}结印`">
        <div class="jutsu-seal-heading">
          <span><Hand :size="15" aria-hidden="true" />结印顺序</span>
          <small>{{ jutsu.sequence.length }} 印</small>
        </div>
        <ol class="gallery-sequence" aria-label="结印顺序">
          <li v-for="(seal, i) in jutsu.sequence" :key="i">
            <span class="seal-step-index" aria-hidden="true">{{
              String(i + 1).padStart(2, '0')
            }}</span>
            <span class="seal-step-glyph">{{ getSeal(seal).name }}</span>
            <small>{{ getSeal(seal).animal }}印</small>
          </li>
        </ol>
      </section>
      <div class="jutsu-card-actions">
        <NuxtLink :to="`/?jutsu=${jutsu.id}`" class="primary-button jutsu-practice-button">
          <Hand :size="16" aria-hidden="true" />开始修炼<ArrowUpRight
            :size="15"
            aria-hidden="true"
          />
        </NuxtLink>
        <button
          v-if="jutsu.effect"
          class="icon-button"
          :aria-label="`预览${jutsu.shortName}`"
          :title="`预览${jutsu.shortName}`"
          @click="$emit('preview', jutsu)"
        >
          <Eye :size="19" aria-hidden="true" />
        </button>
      </div>
    </div>
  </article>
</template>
