<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from '#imports'
import {
  Camera,
  CameraOff,
  Pause,
  Play,
  Volume2,
  VolumeX,
  RotateCcw,
  Check,
  ArrowRight,
  Expand,
  ScanLine,
  CircleAlert,
  Sparkles,
  Eye,
} from 'lucide-vue-next'
import EffectCanvas from './EffectCanvas.vue'
import { useCatalog } from '../composables/useCatalog'
import { SealStabilizer, SequenceMatcher } from '../domain/practice'
import { mirrorPoint } from '../recognition/yolox'
import { useCameraRecognition } from '../composables/useCameraRecognition'
import { useMastery } from '../composables/useMastery'
import { useCastAudio } from '../composables/useCastAudio'
import type { JutsuId, SealId, RecognitionResult, Point } from '../domain/types'
import type { NinjaDefinition } from '../domain/ninjas'
import CloudStatus from './CloudStatus.vue'
import CompanionPanel from './CompanionPanel.vue'
import NinjaReward from './NinjaReward.vue'
import JutsuAttributes from './JutsuAttributes.vue'

const route = useRoute(),
  router = useRouter()
const { JUTSUS, SEALS, NINJAS, getJutsu, getSeal, player } = useCatalog()
const selectedId = ref<JutsuId>(JUTSUS.value[0]!.id)
const selectedSeal = ref<SealId>('boar')
const mode = ref<'jutsu' | 'seal'>('jutsu')
const selected = computed(() => getJutsu(selectedId.value))
const video = ref<HTMLVideoElement | null>(null),
  stage = ref<HTMLDivElement | null>(null)
const effects = ref<InstanceType<typeof EffectCanvas> | null>(null)
const jutsuOptions = ref<HTMLDivElement | null>(null)
const step = ref(0),
  casting = ref(false),
  previewing = ref(false),
  waitingRelease = ref(false)
const recognized = ref<RecognitionResult | null>(null),
  hold = ref(0)
const feedback = ref('等待结印'),
  wrong = ref(false)
const { mastery, markMastered } = useMastery()
const pendingRewards = ref<NinjaDefinition[]>([])
const rewards = ref<NinjaDefinition[]>([])
const { muted, prepare, play } = useCastAudio()
let matcher = new SequenceMatcher(selected.value.sequence)
const stabilizer = new SealStabilizer()
let candidate: SealId | null = null,
  candidateSince = 0,
  neutralSince: number | null = null
let timer: ReturnType<typeof setInterval> | null = null
const nextSeal = computed(() =>
  getSeal(
    mode.value === 'seal'
      ? selectedSeal.value
      : (selected.value.sequence[step.value] ?? selected.value.sequence[0]!),
  ),
)

function reset() {
  matcher = new SequenceMatcher(selected.value.sequence)
  stabilizer.reset()
  effects.value?.clear()
  step.value = 0
  casting.value = false
  previewing.value = false
  waitingRelease.value = false
  recognized.value = null
  hold.value = 0
  candidate = null
  neutralSince = null
  feedback.value = '等待结印'
  wrong.value = false
  // A completed real cast still deserves its reward if its animation was interrupted.
  revealRewards()
}

function revealRewards() {
  if (!pendingRewards.value.length) return
  const merged = new Map(
    [...rewards.value, ...pendingRewards.value].map((ninja) => [ninja.id, ninja]),
  )
  rewards.value = [...merged.values()]
  pendingRewards.value = []
}
function queueRewards(ids: string[]) {
  const added = NINJAS.value.filter((ninja) => ids.includes(ninja.id))
  pendingRewards.value = [
    ...new Map([...pendingRewards.value, ...added].map((ninja) => [ninja.id, ninja])).values(),
  ]
  if (!casting.value || previewing.value) revealRewards()
}

function displayedAnchor(result: RecognitionResult): Point {
  const box = result.box
  const source = mirrorPoint(
    box ? { x: box.x + box.width / 2, y: box.y + box.height / 2 } : { x: 0.5, y: 0.55 },
  )
  if (!stage.value || !video.value?.videoWidth) return source
  const width = stage.value.clientWidth,
    height = stage.value.clientHeight
  const scale = Math.min(width / video.value.videoWidth, height / video.value.videoHeight)
  const fittedWidth = video.value.videoWidth * scale,
    fittedHeight = video.value.videoHeight * scale
  return {
    x: ((width - fittedWidth) / 2 + source.x * fittedWidth) / width,
    y: ((height - fittedHeight) / 2 + source.y * fittedHeight) / height,
  }
}

function onResult(result: RecognitionResult) {
  recognized.value = result
  const now = performance.now()
  const confident = result.seal && result.confidence >= 0.7 ? result.seal : null
  if (!confident) {
    candidate = null
    hold.value = 0
    neutralSince ??= now
  } else {
    neutralSince = null
    if (candidate !== confident) {
      candidate = confident
      candidateSince = now
    }
    hold.value = Math.min(1, (now - candidateSince) / 300)
  }
  if (casting.value) return
  if (waitingRelease.value) {
    if (neutralSince !== null && now - neutralSince >= 200) {
      waitingRelease.value = false
      matcher.release()
      stabilizer.reset()
      feedback.value = '等待下一轮结印'
    }
    return
  }
  const seal = stabilizer.push(result.seal, result.confidence, now)
  if (!seal) return
  if (mode.value === 'seal') {
    wrong.value = seal !== selectedSeal.value
    feedback.value = wrong.value ? `当前为${getSeal(seal).name}印` : `${getSeal(seal).name}印已确认`
    return
  }
  const response = matcher.push(seal, now)
  step.value = matcher.step
  wrong.value = response === 'wrong'
  feedback.value = wrong.value ? `当前为${getSeal(seal).name}印` : `${getSeal(seal).name}印已确认`
  if (response === 'complete') {
    casting.value = true
    previewing.value = false
    feedback.value = '结印完成'
    void markMastered(selectedId.value).then(queueRewards)
    play(selectedId.value)
    if (selected.value.effect) {
      effects.value?.play({
        jutsuId: selectedId.value,
        anchor: displayedAnchor(result),
        timestamp: Date.now(),
      })
    } else finish()
  }
}

const camera = useCameraRecognition(video, onResult)
watch(
  () => player.epoch,
  () => {
    rewards.value = []
    pendingRewards.value = []
    camera.pause()
    reset()
  },
  { flush: 'sync' },
)
const { status, error, fps } = camera
const statusLabel = computed(
  () =>
    ({
      off: '摄像头未开启',
      loading: '正在准备识别',
      live: '识别中',
      paused: '已暂停',
      error: '摄像头不可用',
    })[status.value],
)
const cameraVisible = computed(() => status.value === 'live' || status.value === 'paused')

function selectJutsu(id: JutsuId) {
  void router.replace({ path: '/', query: { jutsu: id } })
}
function switchMode(value: 'jutsu' | 'seal') {
  void router.replace({
    path: '/',
    query: value === 'seal' ? { seal: selectedSeal.value } : { jutsu: selectedId.value },
  })
}
function chooseSeal(id: SealId) {
  void router.replace({ path: '/', query: { seal: id } })
}
function begin() {
  prepare()
  void camera.start()
}
function pause() {
  camera.pause()
  reset()
}
function stop() {
  camera.stop()
  reset()
}
function preview() {
  if (!selected.value.effect) return
  reset()
  prepare()
  casting.value = true
  previewing.value = true
  effects.value?.play({
    jutsuId: selectedId.value,
    anchor: { x: 0.5, y: 0.55 },
    timestamp: Date.now(),
  })
  play(selectedId.value)
}
function finish() {
  casting.value = false
  if (previewing.value) {
    previewing.value = false
    feedback.value = '等待结印'
    stabilizer.reset()
    return
  }
  matcher.finishCast()
  step.value = 0
  waitingRelease.value = true
  neutralSince = null
  feedback.value = '施术成功 · 松手后继续'
  revealRewards()
}
function fullscreen() {
  if (stage.value)
    void stage.value.requestFullscreen().catch((cause: unknown) => {
      feedback.value = `全屏不可用：${cause instanceof Error ? cause.message : String(cause)}`
    })
}

watch(
  () => route.query,
  () => {
    const jutsu = JUTSUS.value.find((entry) => entry.id === route.query.jutsu),
      seal = SEALS.value.find((entry) => entry.id === route.query.seal)
    if (jutsu) selectedId.value = jutsu.id
    if (seal) {
      selectedSeal.value = seal.id
      mode.value = 'seal'
    } else mode.value = 'jutsu'
    reset()
    void nextTick(() => {
      const list = jutsuOptions.value
      const option = list?.querySelector(`[data-jutsu="${selectedId.value}"]`)
      if (!list || !option) return
      const bounds = list.getBoundingClientRect()
      const selectedBounds = option.getBoundingClientRect()
      if (selectedBounds.top < bounds.top) list.scrollTop += selectedBounds.top - bounds.top
      else if (selectedBounds.bottom > bounds.bottom)
        list.scrollTop += selectedBounds.bottom - bounds.bottom
    })
  },
  { immediate: true },
)
watch(status, (value) => {
  if (value === 'error') reset()
})
onMounted(() => {
  timer = setInterval(() => {
    if (status.value === 'live' && mode.value === 'jutsu' && matcher.tick(performance.now())) {
      step.value = 0
      feedback.value = '已重新开始'
      wrong.value = false
      stabilizer.reset()
    }
  }, 100)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="workbench">
    <section class="practice-column" aria-label="摄像头修炼区">
      <div class="section-topline">
        <div class="mode-control" aria-label="练习模式">
          <button :class="{ selected: mode === 'jutsu' }" @click="switchMode('jutsu')">
            忍术修炼</button
          ><button :class="{ selected: mode === 'seal' }" @click="switchMode('seal')">
            单印练习
          </button>
        </div>
        <span class="session-label">{{
          mode === 'seal'
            ? '十二基础印'
            : '卷轴 ' + String(JUTSUS.findIndex((j) => j.id === selectedId) + 1).padStart(2, '0')
        }}</span>
      </div>
      <div
        ref="stage"
        class="camera-stage"
        :class="{ live: cameraVisible, placeholder: !selected.effect && !cameraVisible }"
      >
        <img
          v-if="!cameraVisible && !casting"
          class="stage-poster"
          :src="selected.cover"
          :alt="selected.shortName + (selected.effect ? '演出场景' : '修炼卷轴')"
        />
        <video
          ref="video"
          :class="{ visible: cameraVisible }"
          muted
          playsinline
          aria-label="实时摄像头画面"
        />
        <EffectCanvas ref="effects" @finished="finish" />
        <div class="stage-top">
          <span class="stage-status" :class="{ on: status === 'live' }"
            ><i />{{ previewing ? '效果预览' : statusLabel }}</span
          >
          <div class="stage-actions">
            <button
              class="stage-icon"
              :title="muted ? '开启音效' : '关闭音效'"
              :aria-label="muted ? '开启音效' : '关闭音效'"
              @click="muted = !muted"
            >
              <VolumeX v-if="muted" :size="18" /><Volume2 v-else :size="18" /><span>{{
                muted ? '已静音' : '音效'
              }}</span></button
            ><button class="stage-icon" title="全屏" aria-label="全屏" @click="fullscreen">
              <Expand :size="18" /><span>全屏</span>
            </button>
          </div>
        </div>
        <div
          v-if="!cameraVisible && !casting"
          class="stage-caption"
          :data-category-glyph="selected.category[0] || '忍'"
        >
          <span class="vertical-title">{{
            mode === 'seal' ? nextSeal.name + '之印' : selected.shortName
          }}</span
          ><span class="stage-subtitle">{{
            mode === 'seal' ? nextSeal.reading : selected.category
          }}</span>
        </div>
        <div v-if="status === 'paused'" class="paused-overlay">
          <button class="primary-button" @click="begin"><Play :size="17" />继续修炼</button>
        </div>
        <div v-if="casting" class="cast-title">
          <span>{{ previewing ? '忍术预览' : '结印完成' }}</span
          ><strong>{{ selected.shortName }}</strong
          ><span v-if="!previewing" class="cast-stamp">修炼完成</span>
        </div>
        <div class="stage-bottom">
          <span
            ><ScanLine :size="14" />{{
              status === 'live'
                ? recognized?.seal
                  ? getSeal(recognized.seal).name + '印'
                  : '等待手势'
                : '木叶 · 修炼场'
            }}</span
          ><span v-if="status === 'live'" class="fps-label">{{ fps }} FPS</span
          ><span v-else>其印成，其术现。</span>
        </div>
      </div>
      <div class="camera-toolbar">
        <div class="camera-controls">
          <button
            v-if="status !== 'live' && status !== 'loading'"
            class="primary-button"
            @click="begin"
          >
            <Camera :size="17" />{{
              status === 'paused' ? '继续修炼' : status === 'error' ? '重试摄像头' : '开启摄像头'
            }}</button
          ><button v-if="status === 'loading'" class="primary-button loading-button" disabled>
            <span class="spinner" />正在准备</button
          ><button v-if="status === 'live'" class="secondary-button" @click="pause">
            <Pause :size="16" />暂停</button
          ><button
            v-if="status !== 'off'"
            class="secondary-button"
            aria-label="关闭摄像头"
            title="关闭摄像头"
            @click="stop"
          >
            <CameraOff :size="18" /><span>关闭</span></button
          ><button
            class="icon-button"
            aria-label="重新开始结印"
            title="重新开始结印"
            @click="reset"
          >
            <RotateCcw :size="17" />
          </button>
        </div>
        <button
          v-if="mode === 'jutsu' && selected.effect"
          class="text-button preview-button"
          :disabled="casting"
          @click="preview"
        >
          <Eye :size="16" />效果预览
        </button>
      </div>
      <div v-if="error" class="error-message" role="alert">
        <CircleAlert :size="17" /><span>{{ error }}</span>
      </div>
      <CloudStatus @rewards="queueRewards" />
      <NinjaReward :ninjas="rewards" @dismiss="rewards = []" />
      <div v-if="mode === 'jutsu'" class="sequence-section">
        <div class="section-title">
          <h2>结印顺序</h2>
          <span
            >{{ Math.min(step, selected.sequence.length) }} / {{ selected.sequence.length }}</span
          >
        </div>
        <div
          class="seal-sequence"
          :class="{ long: selected.sequence.length > 6 }"
          :tabindex="selected.sequence.length > 6 ? 0 : undefined"
          aria-label="结印顺序"
        >
          <template v-for="(seal, index) in selected.sequence" :key="`${selectedId}-${index}`"
            ><div
              class="sequence-item"
              :class="{ done: index < step, current: index === step && !casting }"
            >
              <div class="sequence-glyph">
                <span>{{ getSeal(seal).name }}</span>
              </div>
              <span class="sequence-animal">{{ getSeal(seal).animal }}</span
              ><span class="sequence-number">{{ String(index + 1).padStart(2, '0') }}</span>
            </div>
            <ArrowRight
              v-if="index < selected.sequence.length - 1"
              class="sequence-arrow"
              :size="14"
          /></template>
        </div>
      </div>
      <div v-else class="single-seal-picker">
        <button
          v-for="seal in SEALS"
          :key="seal.id"
          :class="{ selected: seal.id === selectedSeal }"
          :aria-label="`练习${seal.name}印`"
          @click="chooseSeal(seal.id)"
        >
          {{ seal.name }}
        </button>
      </div>
      <div class="recognition-strip" :class="{ wrong }">
        <span class="recognition-icon"><ScanLine :size="18" /></span><span>{{ feedback }}</span
        ><span v-if="status === 'live' && recognized" class="confidence">{{
          recognized.seal ? Math.round(recognized.confidence * 100) + '%' : '—'
        }}</span>
        <div class="hold-track"><i :style="{ width: `${hold * 100}%` }" /></div>
      </div>
    </section>
    <aside class="learning-column">
      <CompanionPanel />
      <div class="section-title">
        <h2>结印手札</h2>
        <span>修行之卷</span>
      </div>
      <div class="jutsu-selector">
        <div ref="jutsuOptions" class="jutsu-options">
          <button
            v-for="(jutsu, index) in JUTSUS"
            :key="jutsu.id"
            class="jutsu-option"
            :data-jutsu="jutsu.id"
            :data-category="jutsu.category"
            :class="{ selected: mode === 'jutsu' && selectedId === jutsu.id }"
            @click="selectJutsu(jutsu.id)"
          >
            <span class="jutsu-mini" :class="{ placeholder: !jutsu.effect }"
              ><img :src="jutsu.cover" :alt="jutsu.shortName" /><span
                v-if="!jutsu.effect"
                aria-hidden="true"
                >{{ jutsu.category[0] || '忍' }}</span
              ></span
            ><span class="jutsu-option-copy"
              ><strong>{{ jutsu.shortName }}</strong
              ><JutsuAttributes :category="jutsu.category" :attack-power="jutsu.attackPower" />
              <span>{{ jutsu.sequence.length }} 枚结印</span></span
            ><Check v-if="mastery[jutsu.id]" class="mastery-check" :size="16" /><span
              v-else
              class="jutsu-index"
              >{{ String(index + 1).padStart(2, '0') }}</span
            >
          </button>
        </div>
      </div>
      <div class="seal-instruction">
        <div class="instruction-header">
          <div>
            <span class="eyebrow">{{ mode === 'seal' ? '基础结印' : '当前结印' }}</span>
            <h2>
              {{ nextSeal.name }}<span>{{ nextSeal.animal }}之印</span>
            </h2>
          </div>
          <span class="seal-reading">{{ nextSeal.reading }}</span>
        </div>
        <div class="instruction-image">
          <img :src="nextSeal.image" :alt="`${nextSeal.name}印的真实手势示范`" /><span
            class="image-stamp"
            >{{ nextSeal.name }}</span
          >
        </div>
        <p class="seal-hint">{{ nextSeal.hint }}</p>
        <div class="instruction-footer">
          <span>十二基础印</span
          ><NuxtLink to="/gallery?tab=seals" class="quiet-link"
            >查看全部<ArrowRight :size="14"
          /></NuxtLink>
        </div>
      </div>
      <div class="jutsu-note">
        <Sparkles :size="17" />
        <div>
          <h3>{{ selected.shortName }}</h3>
          <p>{{ selected.description }}</p>
        </div>
      </div>
    </aside>
  </div>
</template>
