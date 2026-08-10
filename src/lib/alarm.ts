/**
 * 경보음을 브라우저에서 직접 합성합니다.
 * 음원 파일을 받아오지 않으므로 네트워크 요청이 한 건도 생기지 않습니다.
 *
 * ⚠️ 소리는 어디까지나 보너스입니다.
 *   - 아이폰은 측면 무음 스위치가 켜져 있으면 소리도 진동도 나지 않습니다
 *   - 전시장은 시끄럽습니다
 *   화면만으로 연출이 완결되게 만들어져 있어야 합니다.
 */

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (ctx) return ctx
  const w = window as unknown as {
    AudioContext?: typeof AudioContext
    webkitAudioContext?: typeof AudioContext
  }
  const Ctor = w.AudioContext ?? w.webkitAudioContext
  if (!Ctor) return null
  ctx = new Ctor()
  return ctx
}

/**
 * 브라우저는 사용자가 화면을 건드리기 전에는 소리를 내주지 않습니다.
 * [응모하기]를 누르는 그 순간에 불러야 합니다.
 */
export function unlockAudio(): void {
  const c = getCtx()
  if (c && c.state === 'suspended') void c.resume()
}

/**
 * 삐-삐-삐 (경고음 3회) → 삐뽀삐뽀 (두 톤 사이렌).
 * 되돌려주는 함수를 부르면 즉시 끊깁니다.
 */
export function startAlarm(volume: number): () => void {
  const c = getCtx()
  if (!c) return () => {}
  if (c.state === 'suspended') void c.resume()

  const master = c.createGain()
  master.gain.value = volume
  master.connect(c.destination)

  const t0 = c.currentTime

  // 삐 · 삐 · 삐
  const beep = c.createOscillator()
  const beepGain = c.createGain()
  beep.type = 'square'
  beep.frequency.value = 1150
  beepGain.gain.setValueAtTime(0, t0)
  for (let i = 0; i < 3; i++) {
    const start = t0 + i * 0.22
    beepGain.gain.setValueAtTime(0.9, start)
    beepGain.gain.setValueAtTime(0, start + 0.12)
  }
  beep.connect(beepGain)
  beepGain.connect(master)
  beep.start(t0)
  beep.stop(t0 + 0.7)

  // 삐뽀 삐뽀 — 0.42초마다 두 톤을 번갈아
  const siren = c.createOscillator()
  const sirenGain = c.createGain()
  const sirenStart = t0 + 0.72
  const LOW = 700
  const HIGH = 960
  const STEP = 0.42
  const STEPS = 60
  siren.type = 'square'
  for (let i = 0; i < STEPS; i++) {
    siren.frequency.setValueAtTime(i % 2 === 0 ? LOW : HIGH, sirenStart + i * STEP)
  }
  sirenGain.gain.setValueAtTime(0, t0)
  sirenGain.gain.setValueAtTime(0.55, sirenStart)
  siren.connect(sirenGain)
  sirenGain.connect(master)
  siren.start(sirenStart)
  siren.stop(sirenStart + STEPS * STEP)

  let stopped = false
  return () => {
    if (stopped) return
    stopped = true
    const now = c.currentTime
    // 15ms 만에 끊습니다 — '뚝' 끊기는 느낌은 살리되 스피커 팝음은 피합니다
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(master.gain.value, now)
    master.gain.linearRampToValueAtTime(0, now + 0.015)
    try {
      beep.stop(now + 0.02)
    } catch {
      /* 이미 끝난 경우 */
    }
    try {
      siren.stop(now + 0.02)
    } catch {
      /* 이미 끝난 경우 */
    }
  }
}
