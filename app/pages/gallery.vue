<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useSeoMeta } from '#imports'
import {
  ScrollText,
  ArrowUpRight,
  Eye,
  Check,
  ArrowRight,
  X,
  Hand,
  CircleAlert,
} from 'lucide-vue-next'
import { JUTSUS, SEALS, getSeal } from '../domain/catalog'
import { useMastery } from '../composables/useMastery'
import { useCastAudio } from '../composables/useCastAudio'
import EffectCanvas from '../components/EffectCanvas.vue'
import type { JutsuDefinition } from '../domain/types'

useSeoMeta({ title: '忍术展览馆 · 结印修炼场' })
const route = useRoute()
const tab = ref<'jutsu' | 'seals'>('jutsu')
const { mastery, count, warning } = useMastery()
const previewJutsu = ref<JutsuDefinition | null>(null)
const effects = ref<InstanceType<typeof EffectCanvas> | null>(null)
type Focusable = { focus: () => void }
const dialogClose = ref<Focusable | null>(null)
const previewTrigger = ref<Focusable | null>(null)
const { prepare, play } = useCastAudio()
const tabLabel = computed(() => (tab.value === 'jutsu' ? '忍术卷轴' : '十二基础印'))
watch(
  () => route.query.tab,
  (value) => {
    tab.value = value === 'seals' ? 'seals' : 'jutsu'
  },
  { immediate: true },
)
async function preview(jutsu: JutsuDefinition) {
  if (!previewJutsu.value) {
    previewTrigger.value =
      document.activeElement?.tagName === 'BUTTON'
        ? (document.activeElement as unknown as Focusable)
        : null
  }
  prepare()
  previewJutsu.value = jutsu
  await nextTick()
  dialogClose.value?.focus()
  effects.value?.play({ jutsuId: jutsu.id, anchor: { x: 0.5, y: 0.55 }, timestamp: Date.now() })
  play(jutsu.id)
}
function closePreview() {
  effects.value?.clear()
  previewJutsu.value = null
  nextTick(() => previewTrigger.value?.focus())
}
function trapDialogFocus(event: { key: string; shiftKey: boolean; preventDefault: () => void }) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closePreview()
    return
  }
  if (event.key !== 'Tab') return
  const start = document.querySelector('.preview-modal-footer a.primary-button') as Focusable | null
  if (event.shiftKey && document.activeElement === dialogClose.value) {
    event.preventDefault()
    start?.focus()
  } else if (!event.shiftKey && document.activeElement === start) {
    event.preventDefault()
    dialogClose.value?.focus()
  }
}
</script>

<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">木叶秘藏 · 忍术图鉴</p>
      <h1>忍术展览馆</h1>
    </div>
    <span class="heading-tag"><ScrollText :size="15" />已掌握 {{ count }} / 3</span>
  </div>
  <div class="gallery-topline">
    <div class="mode-control">
      <button :class="{ selected: tab === 'jutsu' }" @click="tab = 'jutsu'">忍术卷轴</button
      ><button :class="{ selected: tab === 'seals' }" @click="tab = 'seals'">十二基础印</button>
    </div>
    <span class="session-label"
      >{{ tabLabel }} · {{ tab === 'jutsu' ? JUTSUS.length : SEALS.length }}</span
    >
  </div>
  <p v-if="warning" class="error-message" role="status"><CircleAlert :size="17" />{{ warning }}</p>
  <div v-if="tab === 'jutsu'" class="gallery-grid">
    <article
      v-for="(jutsu, index) in JUTSUS"
      :key="jutsu.id"
      class="jutsu-card"
      :data-jutsu="jutsu.id"
    >
      <div class="jutsu-cover">
        <img :src="jutsu.cover" :alt="jutsu.shortName + '演出'" /><span class="cover-category">{{
          jutsu.category
        }}</span
        ><span class="cover-glyph">{{
          jutsu.id === 'summoning' ? '契' : jutsu.id === 'fireball' ? '火' : '雷'
        }}</span>
      </div>
      <div class="jutsu-card-body">
        <div class="jutsu-card-meta">
          <span>忍术之卷 {{ String(index + 1).padStart(2, '0') }}</span
          ><span class="mastery-badge" :class="{ mastered: !!mastery[jutsu.id] }"
            ><Check v-if="mastery[jutsu.id]" :size="12" />{{
              mastery[jutsu.id] ? '已掌握' : '未掌握'
            }}</span
          >
        </div>
        <h2>{{ jutsu.shortName }}</h2>
        <p>{{ jutsu.description }}</p>
        <div class="gallery-sequence">
          <template v-for="(seal, i) in jutsu.sequence" :key="i"
            ><span :title="getSeal(seal).animal + '印'">{{ getSeal(seal).name }}</span
            ><ArrowRight v-if="i < jutsu.sequence.length - 1" :size="10"
          /></template>
        </div>
        <div class="jutsu-card-actions">
          <NuxtLink :to="`/?jutsu=${jutsu.id}`" class="primary-button"
            ><Hand :size="16" />开始修炼<ArrowUpRight :size="14" /></NuxtLink
          ><button
            class="icon-button"
            :aria-label="`预览${jutsu.shortName}`"
            :title="`预览${jutsu.shortName}`"
            @click="preview(jutsu)"
          >
            <Eye :size="19" />
          </button>
        </div>
      </div>
    </article>
  </div>
  <div v-else class="seal-gallery">
    <article v-for="(seal, index) in SEALS" :key="seal.id" class="seal-card">
      <div class="seal-card-photo">
        <img :src="seal.image" :alt="`${seal.name}印手势示范`" /><span>{{
          String(index + 1).padStart(2, '0')
        }}</span>
      </div>
      <div class="seal-card-body">
        <h2>
          {{ seal.name }}<span>{{ seal.animal }}之印</span>
        </h2>
        <p>{{ seal.hint }}</p>
        <NuxtLink :to="`/?seal=${seal.id}`" class="quiet-link"
          >练习此印<ArrowUpRight :size="15"
        /></NuxtLink>
      </div>
    </article>
  </div>
  <div class="gallery-bottom">
    <span>木叶忍术档案</span
    ><span>{{ tab === 'jutsu' ? '三卷忍术，待你掌握。' : '十二枚印，万千变化。' }}</span>
  </div>
  <Teleport to="body"
    ><div
      v-if="previewJutsu"
      class="modal-backdrop"
      @click.self="closePreview"
      @keydown.esc="closePreview"
    >
      <section
        class="preview-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="previewJutsu.shortName + '效果预览'"
        @keydown.capture="trapDialogFocus"
      >
        <div class="preview-modal-header">
          <div>
            <span class="eyebrow">效果预览</span>
            <h2>{{ previewJutsu.shortName }}</h2>
          </div>
          <button
            ref="dialogClose"
            class="icon-button"
            aria-label="关闭预览"
            title="关闭预览"
            @click="closePreview"
          >
            <X :size="21" />
          </button>
        </div>
        <div class="preview-stage">
          <EffectCanvas ref="effects" /><span class="preview-watermark">木叶 · 忍术之卷</span>
        </div>
        <div class="preview-modal-footer">
          <button class="secondary-button" @click="preview(previewJutsu)">
            <Eye :size="16" />再次预览</button
          ><NuxtLink
            :to="`/?jutsu=${previewJutsu.id}`"
            class="primary-button"
            tabindex="0"
            @click="closePreview"
            >开始修炼<ArrowRight :size="16"
          /></NuxtLink>
        </div>
      </section></div
  ></Teleport>
</template>
