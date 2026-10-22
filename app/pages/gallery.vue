<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter, useSeoMeta } from '#imports'
import { ScrollText, Eye, ArrowRight, X } from 'lucide-vue-next'
import { useCatalog } from '../composables/useCatalog'
import { useMastery } from '../composables/useMastery'
import { useCastAudio } from '../composables/useCastAudio'
import EffectCanvas from '../components/EffectCanvas.vue'
import type { JutsuDefinition } from '../domain/types'
import NinjaGallery from '../components/NinjaGallery.vue'
import JutsuCard from '../components/JutsuCard.vue'
import CloudStatus from '../components/CloudStatus.vue'

useSeoMeta({ title: '忍术展览馆 · 结印修炼场' })
const route = useRoute()
const router = useRouter()
const tab = ref<'jutsu' | 'seals' | 'ninjas'>('jutsu')
const { mastery, count } = useMastery()
const { JUTSUS, SEALS, NINJAS } = useCatalog()
const previewJutsu = ref<JutsuDefinition | null>(null)
const effects = ref<InstanceType<typeof EffectCanvas> | null>(null)
type Focusable = { focus: () => void }
const dialogClose = ref<Focusable | null>(null)
const previewTrigger = ref<Focusable | null>(null)
const { prepare, play } = useCastAudio()
const tabLabel = computed(() =>
  tab.value === 'jutsu' ? '忍术卷轴' : tab.value === 'seals' ? '十二基础印' : '忍者图鉴',
)
function switchTab(value: 'jutsu' | 'seals' | 'ninjas') {
  void router.push({ path: '/gallery', query: { ...route.query, tab: value } })
}
watch(
  () => route.query.tab,
  (value) => {
    tab.value = value === 'seals' ? 'seals' : value === 'ninjas' ? 'ninjas' : 'jutsu'
  },
  { immediate: true },
)
async function preview(jutsu: JutsuDefinition) {
  if (!jutsu.effect) return
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
    <span class="heading-tag"
      ><ScrollText :size="15" />已掌握 {{ count }} / {{ JUTSUS.length }}</span
    >
  </div>
  <div class="gallery-topline">
    <div class="mode-control gallery-tabs" aria-label="展览馆分类">
      <button
        :class="{ selected: tab === 'jutsu' }"
        :aria-pressed="tab === 'jutsu'"
        @click="switchTab('jutsu')"
      >
        忍术卷轴</button
      ><button
        :class="{ selected: tab === 'seals' }"
        :aria-pressed="tab === 'seals'"
        @click="switchTab('seals')"
      >
        十二基础印
      </button>
      <button
        :class="{ selected: tab === 'ninjas' }"
        :aria-pressed="tab === 'ninjas'"
        @click="switchTab('ninjas')"
      >
        忍者图鉴
      </button>
    </div>
    <span class="session-label"
      >{{ tabLabel }} ·
      {{ tab === 'jutsu' ? JUTSUS.length : tab === 'seals' ? SEALS.length : NINJAS.length }}</span
    >
  </div>
  <CloudStatus />
  <div v-if="tab === 'jutsu'" class="gallery-grid">
    <JutsuCard
      v-for="(jutsu, index) in JUTSUS"
      :key="jutsu.id"
      :jutsu="jutsu"
      :index="index"
      :mastered="!!mastery[jutsu.id]"
      @preview="preview"
    />
  </div>
  <div v-else-if="tab === 'seals'" class="seal-gallery">
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
      </div>
    </article>
  </div>
  <NinjaGallery v-else />
  <div class="gallery-bottom">
    <span>木叶忍术档案</span
    ><span>{{
      tab === 'jutsu'
        ? `${JUTSUS.length} 卷忍术，待你掌握。`
        : tab === 'seals'
          ? '十二枚印，万千变化。'
          : `${NINJAS.length} 位忍者，与你并肩修行。`
    }}</span>
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
