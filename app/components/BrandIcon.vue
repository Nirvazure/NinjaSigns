<script setup lang="ts">
withDefaults(defineProps<{ alt?: string }>(), { alt: '' })
</script>

<template>
  <img class="brand-mark" :src="'/images/ui/project-icon.webp'" :alt="alt" width="64" height="64" />
</template>
