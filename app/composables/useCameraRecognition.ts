import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import type { RecognitionResult, WorkerResponse } from '../domain/types'

export function useCameraRecognition(
  video: Ref<HTMLVideoElement | null>,
  onResult: (result: RecognitionResult) => void,
) {
  const status = ref<'off' | 'loading' | 'live' | 'paused' | 'error'>('off')
  const error = ref('')
  const fps = ref(0)
  let worker: Worker | null = null
  let stream: MediaStream | null = null
  let frameId = 0
  let generation = 0
  let busy = false
  let lastFrame = 0
  let lastResult = 0
  let initTimer: ReturnType<typeof setTimeout> | null = null
  let cancelInit: (() => void) | null = null

  function cleanup() {
    generation++
    cancelAnimationFrame(frameId)
    cancelInit?.()
    cancelInit = null
    if (initTimer) clearTimeout(initTimer)
    initTimer = null
    worker?.terminate()
    worker = null
    stream?.getTracks().forEach((track) => track.stop())
    stream = null
    if (video.value) video.value.srcObject = null
    busy = false
    fps.value = 0
    lastResult = 0
  }

  function fail(message: string) {
    cleanup()
    error.value = message
    status.value = 'error'
  }

  function loop(now: number) {
    if (status.value !== 'live') return
    frameId = requestAnimationFrame(loop)
    if (busy || now - lastFrame < 80 || !video.value || video.value.readyState < 2) return
    busy = true
    lastFrame = now
    const token = generation
    createImageBitmap(video.value)
      .then((bitmap) => {
        if (token !== generation || status.value !== 'live' || !worker) {
          bitmap.close()
          if (token === generation) busy = false
          return
        }
        worker.postMessage({ type: 'frame', bitmap, timestamp: now }, [bitmap])
      })
      .catch((cause: unknown) => {
        if (token === generation)
          fail(`摄像头画面读取失败：${cause instanceof Error ? cause.message : String(cause)}`)
      })
  }

  async function start() {
    if (status.value === 'live' || status.value === 'loading') return
    if (status.value === 'paused') {
      status.value = 'live'
      lastResult = 0
      frameId = requestAnimationFrame(loop)
      return
    }
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      fail('摄像头需要 HTTPS 或 localhost 地址。')
      return
    }
    if (typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') {
      fail('当前浏览器不支持画面识别，请使用新版 Chrome、Edge 或 Safari。')
      return
    }
    cleanup()
    const token = generation
    error.value = ''
    status.value = 'loading'
    try {
      const instance = new Worker(new URL('../workers/recognition.worker.ts', import.meta.url), {
        type: 'module',
      })
      worker = instance
      await new Promise<void>((resolve, reject) => {
        cancelInit = () => reject(new Error('识别启动已取消'))
        initTimer = setTimeout(() => reject(new Error('识别模型加载超时，请重试。')), 30000)
        instance.onerror = (event) => {
          if (worker !== instance) return
          const message = event.message || '识别引擎无法启动，请重试。'
          if (status.value === 'loading') reject(new Error(message))
          else fail(message)
        }
        instance.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
          if (worker !== instance) return
          if (data.type === 'ready') {
            if (initTimer) clearTimeout(initTimer)
            initTimer = null
            cancelInit = null
            resolve()
            return
          }
          if (data.type === 'error') {
            if (status.value === 'loading') reject(new Error(data.message))
            else fail(`识别中断：${data.message}`)
            return
          }
          busy = false
          if (status.value !== 'live') return
          const now = performance.now()
          if (lastResult) fps.value = Math.round(1000 / (now - lastResult))
          lastResult = now
          onResult(data.result)
        }
        instance.postMessage({ type: 'init' })
      })
      if (token !== generation) return
      const acquired = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      if (token !== generation) {
        acquired.getTracks().forEach((track) => track.stop())
        return
      }
      stream = acquired
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => fail('摄像头已断开，请重新开启。')
      })
      if (!video.value) throw new Error('摄像头画面尚未就绪')
      video.value.srcObject = acquired
      await video.value.play()
      if (token !== generation) return
      status.value = 'live'
      frameId = requestAnimationFrame(loop)
    } catch (cause) {
      if (token !== generation) return
      const name = cause instanceof Error ? cause.name : ''
      const messages: Record<string, string> = {
        NotAllowedError: '摄像头权限被拒绝，请在浏览器地址栏允许摄像头访问。',
        NotFoundError: '未找到摄像头，请连接设备后重试。',
        NotReadableError: '摄像头正在被其他应用占用，请关闭占用后重试。',
        OverconstrainedError: '摄像头不支持当前画面设置，请更换设备。',
      }
      fail(messages[name] ?? `启动失败：${cause instanceof Error ? cause.message : String(cause)}`)
    }
  }

  function pause() {
    if (status.value === 'live') {
      cancelAnimationFrame(frameId)
      status.value = 'paused'
      fps.value = 0
    }
  }
  function stop() {
    cleanup()
    status.value = 'off'
    error.value = ''
  }
  const visibility = () => {
    if (document.hidden) pause()
  }
  onMounted(() => document.addEventListener('visibilitychange', visibility))
  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', visibility)
    stop()
  })
  return { status, error, fps, start, pause, stop }
}
