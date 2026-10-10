<script setup lang="ts">
import { Check, LockKeyhole, ArrowRight } from 'lucide-vue-next'
import { useNinjaCollection } from '../composables/useNinjaCollection'

const { entries, ready, unlockedCount, selectedNinja, selectNinja } = useNinjaCollection()
</script>

<template>
  <section aria-label="忍者图鉴" :aria-busy="!ready">
    <div class="ninja-gallery-intro">
      <div>
        <p class="eyebrow">每一次结印，都离伙伴更近</p>
        <h2>与你并肩的忍者</h2>
      </div>
      <p>已结识 {{ unlockedCount }} / {{ entries.length }} 位 · 成功施术解锁伙伴</p>
    </div>
    <div class="ninja-grid">
      <article
        v-for="entry in entries"
        :key="entry.ninja.id"
        class="ninja-card"
        :class="{ unlocked: entry.unlocked, 'is-companion': entry.ninja.id === selectedNinja.id }"
        :data-ninja="entry.ninja.id"
      >
        <div class="ninja-portrait" :class="{ locked: !entry.unlocked }">
          <span class="ninja-number">{{ entry.ninja.id.slice(-2) }}</span>
          <img
            :src="entry.ninja.image"
            :alt="`${entry.ninja.name}${entry.unlocked ? '像素立绘' : '剪影'}`"
            width="132"
            height="189"
          />
          <span class="ninja-status" :class="{ owned: entry.unlocked }">
            <Check v-if="entry.unlocked" :size="14" /><LockKeyhole v-else :size="14" />
            {{ entry.unlocked ? '已解锁' : '未解锁' }}
          </span>
        </div>
        <div class="ninja-card-body">
          <h3>{{ entry.ninja.name }}</h3>
          <p class="ninja-condition">{{ entry.condition }}</p>
          <div class="ninja-progress-copy">
            <span>{{ entry.unlocked ? '修炼达成' : '修炼进度' }}</span>
            <span>{{ entry.current }} / {{ entry.required }}</span>
          </div>
          <progress
            :value="entry.current"
            :max="entry.required"
            :aria-label="`${entry.ninja.name}解锁进度`"
          />
          <button
            class="secondary-button"
            :disabled="!ready || !entry.unlocked"
            :aria-pressed="entry.ninja.id === selectedNinja.id"
            @click="selectNinja(entry.ninja.id)"
          >
            <Check v-if="entry.ninja.id === selectedNinja.id" :size="15" />
            {{
              !entry.unlocked
                ? '尚未解锁'
                : entry.ninja.id === selectedNinja.id
                  ? '当前伙伴'
                  : '设为伙伴'
            }}
          </button>
        </div>
      </article>
    </div>
    <NuxtLink to="/" class="quiet-link ninja-return"
      >回到修炼场，结识更多伙伴<ArrowRight :size="16"
    /></NuxtLink>
  </section>
</template>
