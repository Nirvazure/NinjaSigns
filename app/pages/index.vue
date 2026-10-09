<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next'
</script>
<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">忍道，从一枚结印开始</p>
      <h1>火影 · 结印修炼</h1>
    </div>
    <span class="heading-tag"><Sparkles :size="15" />修行之卷</span>
  </div>
  <ClientOnly
    ><PracticeRoom /><template #fallback
      ><div class="loading-room"><span class="brand-mark">印</span></div></template
    ></ClientOnly
  >
</template>
