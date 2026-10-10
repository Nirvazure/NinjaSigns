<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { renderEffect } from '../effects/render'
import { getJutsu } from '../domain/catalog'
import type { CastEvent, JutsuEffectId, Point } from '../domain/types'

const emit = defineEmits<{ finished: [] }>()
const canvas = ref<HTMLCanvasElement | null>(null)
let observer: ResizeObserver | null = null
let animation = 0
let active: { effect: JutsuEffectId; duration: number } | null = null
let started = 0
let anchor: Point = { x: 0.5, y: 0.55 }
let reducedMotion = false

function draw(now: number) {
  if (!active || !canvas.value) return
  const context = canvas.value.getContext('2d')!
  const elapsed = now - started
  if (elapsed >= active.duration) {
    context.clearRect(0, 0, canvas.value.width, canvas.value.height)
    active = null
    emit('finished')
    return
  }
  renderEffect(
    context,
    canvas.value.width,
    canvas.value.height,
    active.effect,
    reducedMotion ? 1.7 : elapsed / 1000,
    anchor,
  )
  animation = requestAnimationFrame(draw)
}

function play(event: CastEvent, position: Point = event.anchor) {
  clear()
  const jutsu = getJutsu(event.jutsuId)
  if (!jutsu.effect) {
    emit('finished')
    return
  }
  active = { effect: jutsu.effect, duration: jutsu.duration }
  anchor = position
  started = performance.now()
  animation = requestAnimationFrame(draw)
}
function clear() {
  cancelAnimationFrame(animation)
  active = null
  const context = canvas.value?.getContext('2d')
  if (context && canvas.value) context.clearRect(0, 0, canvas.value.width, canvas.value.height)
}

onMounted(() => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  observer = new ResizeObserver(([entry]) => {
    if (!canvas.value || !entry) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.value.width = Math.round(entry.contentRect.width * dpr)
    canvas.value.height = Math.round(entry.contentRect.height * dpr)
  })
  if (canvas.value) observer.observe(canvas.value)
})
onBeforeUnmount(() => {
  clear()
  observer?.disconnect()
})
defineExpose({ play, clear })
</script>

<template><canvas ref="canvas" class="effect-canvas" aria-label="忍术演出" /></template>
