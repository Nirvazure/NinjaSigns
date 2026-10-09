import { onBeforeUnmount, ref, watch } from 'vue'
import type { JutsuId } from '../domain/types'

export function useCastAudio() {
  const muted = ref(false)
  let audio: AudioContext | null = null
  function prepare() {
    if (muted.value) return
    try {
      audio ??= new AudioContext()
      void audio.resume().catch((error: unknown) => console.warn('Audio resume failed', error))
    } catch (error) {
      console.warn('Audio unavailable', error)
    }
  }
  function play(id: JutsuId) {
    if (muted.value || !audio || audio.state !== 'running') return
    const oscillator = audio.createOscillator(),
      gain = audio.createGain()
    const frequency = id === 'chidori' ? 220 : id === 'fireball' ? 90 : 60
    oscillator.type = id === 'chidori' ? 'sawtooth' : 'sine'
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 3, audio.currentTime + 0.25)
    gain.gain.setValueAtTime(0, audio.currentTime)
    gain.gain.linearRampToValueAtTime(0.05, audio.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.7)
    oscillator.connect(gain)
    gain.connect(audio.destination)
    oscillator.start()
    oscillator.stop(audio.currentTime + 0.75)
    oscillator.onended = () => {
      oscillator.disconnect()
      gain.disconnect()
    }
  }
  watch(muted, (value) => {
    if (!audio) return
    if (value)
      void audio.suspend().catch((error: unknown) => console.warn('Audio mute failed', error))
    else prepare()
  })
  onBeforeUnmount(() => {
    if (audio)
      void audio.close().catch((error: unknown) => console.warn('Audio cleanup failed', error))
  })
  return { muted, prepare, play }
}
