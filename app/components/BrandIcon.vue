<script setup lang="ts">
withDefaults(defineProps<{ alt?: string }>(), { alt: '' })
</script>

<template>
  <img class="brand-mark" :src="'/icon.png'" :alt="alt" width="64" height="64" />
</template>
