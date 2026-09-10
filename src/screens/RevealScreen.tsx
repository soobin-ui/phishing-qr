import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { reveal } from '../lib/content'
import { buildCards, buzz } from '../lib/reveal'
import { startAlarm } from '../lib/alarm'
import { fill, lines } from '../lib/format'
import type { Answers } from '../types'

interface Props {
  answers: Answers
  onNext: () => void
}

/**
 * [3] 빨간 화면. 세 박자.
 *   1) 순차 등장 — ! 가 가운데서 크게 깜빡 → 밑에 [경고] → 둘이 위로 올라가며
 *      '개인정보 유출'이 한 글자씩(셋이 같이 깜빡) → 한 칸 더 올라가며 적은 값이 주르륵
 *      → 이메일 밑 [다음]. 눌러야 다음으로 넘어갑니다.
 *   2) 큰 글씨 한 방
 *   3) 사이렌 이모지가 반짝이며 질문 하나
 */
type Stage = 'alarm' | 'punch' | 'question' | 'after'

// 1·2단계(유출 기록·마지막 문구)와 경광봉 화면 모두 검은 바탕입니다
const NIGHT = '#05060a'

/** 기기 설정의 '동작 줄이기' */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

/**
 * 깜빡이는 빨간 네온 삼각형. 이 화면의 상징입니다.
 * ★ 작은 휴대폰(320x568)에서도 아래 여섯 줄까지 다 들어가야 하므로
 *   크기를 화면 높이·폭에 함께 묶어 둡니다. 고정 px 로 두면 넘칩니다.
 *
 * still = 점멸을 스스로 하지 않습니다(감싼 .qr-blink-group 이 대신 깜빡입니다).
 */
function NeonTriangle({ small = false, still = false }: { small?: boolean; still?: boolean }) {
  const w = small ? 'min(104px, 12vh, 30vw)' : 'min(150px, 17vh, 40vw)'
  return (
    <svg
      className={still ? 'qr-neon-still' : 'qr-neon'}
      style={{ width: w, height: `calc(${w} * 132 / 150)` }}
      viewBox="0 0 150 132"
      aria-hidden="true"
    >
      <path d="M75 10 L142 122 H8 Z" fill="none" stroke="#ff2d3c" strokeWidth="9" strokeLinejoin="round" />
      <path d="M75 48 V86" stroke="#ff2d3c" strokeWidth="10" strokeLinecap="round" />
      <circle cx="75" cy="103" r="6" fill="#ff2d3c" />
    </svg>
  )
}

const EASE = [0.2, 0.7, 0.2, 1] as const
const GLIDE = [0.65, 0, 0.35, 1] as const

export default function RevealScreen({ answers, onNext }: Props) {
  const cards = useMemo(() => buildCards(answers), [answers])
  const [stage, setStage] = useState<Stage>('alarm')
  const alarming = stage === 'alarm' || stage === 'punch'
  const reduced = usePrefersReducedMotion()

  /**
   * 순차 등장 단계.
   *   0: ! 만 (가운데, 크게)
   *   1: + [경고]
   *   2: + '개인정보 유출' (한 글자씩)
   *   3: + 적은 값이 주르륵 (셋은 제 크기로 올라감)
   *   4: 이메일 밑 [다음] 활성
   * 화면 재배치(위로 올라감)는 framer-motion 의 layout 이 알아서 부드럽게 잇습니다.
   */
  const [phase, setPhase] = useState(0)

  // 제목 '개인정보', '유출' 을 한 글자씩. 두 줄에 걸쳐 이어지는 순번을 매깁니다.
  const titleLines = reveal.alarm.titleLines
  const titleLen = titleLines.join('').length

  // 삼각형 크기 — 처음엔 크게, 정보가 나올 즈음 제 크기로
  const triScale = phase >= 3 ? 1 : phase >= 2 ? 1.22 : 1.5

  // 이름을 적었으면 이름을 부르고, 아니면 이름 없는 판을 씁니다
  const name = (answers.name ?? '').trim()
  const punchLines =
    cards.length === 0
      ? reveal.punch.zeroLines
      : name === ''
        ? reveal.punch.linesNoName
        : reveal.punch.lines

  const stopAlarmRef = useRef<() => void>(() => {})
  const tailTimerRef = useRef<number | undefined>(undefined)
  const advancedRef = useRef(false)

  // ── 사이렌 (마운트 때 한 번 켜고, 질문 화면에서 끕니다) ──
  useEffect(() => {
    const stopAlarm = reveal.sound.enabled ? startAlarm(reveal.sound.volume) : () => {}
    stopAlarmRef.current = stopAlarm
    buzz([120, 90, 120, 90, 120, 90, 600])
    return () => {
      if (tailTimerRef.current) clearTimeout(tailTimerRef.current)
      stopAlarm()
      buzz(0)
    }
  }, [])

  // ── 순차 등장 시간표 ──
  useEffect(() => {
    const T = reveal.timing
    if (reduced) {
      setPhase(4)
      return
    }
    setPhase(0)
    const timers: number[] = []
    const tTag = T.triAloneMs
    const tTitle = tTag + T.tagAloneMs
    const tTitleDone = tTitle + 150 + titleLen * T.titleCharMs + 400
    const tRows = tTitleDone + T.titleAloneMs
    const tButton = tRows + 200 + Math.max(cards.length - 1, 0) * T.rowGapMs + 800

    timers.push(window.setTimeout(() => setPhase(1), tTag))
    timers.push(window.setTimeout(() => setPhase(2), tTitle))
    timers.push(
      window.setTimeout(() => {
        setPhase(3)
        buzz(200)
      }, tRows),
    )
    timers.push(window.setTimeout(() => setPhase(4), tButton))

    return () => timers.forEach(clearTimeout)
  }, [reduced, cards.length, titleLen])

  /**
   * 큰 글씨 화면에서 다음으로 넘어갑니다.
   * [다음] 버튼을 눌러도, 가만히 있어서 시간이 다 돼도 여기로 옵니다.
   */
  const goQuestion = useCallback(() => {
    if (advancedRef.current) return
    advancedRef.current = true
    setStage('question')
    // 경광봉은 계속 번쩍이고, 소리만 잠시 뒤에 끕니다
    tailTimerRef.current = window.setTimeout(() => {
      stopAlarmRef.current()
      buzz(0)
    }, reveal.timing.sirenTailMs)
  }, [])

  // 큰 글씨 화면(punch)에 들어가면 punchMs 뒤 자동으로 질문으로
  useEffect(() => {
    if (stage !== 'punch') return
    const t = window.setTimeout(goQuestion, reveal.timing.punchMs)
    return () => clearTimeout(t)
  }, [stage, goQuestion])

  // [다음] — 순차 등장 → 큰 글씨. 사운드/진동은 그대로 이어집니다.
  const toPunch = useCallback(() => {
    setStage('punch')
    buzz(300)
  }, [])

  return (
    <div
      className={`fixed inset-0 overflow-hidden ${alarming ? 'qr-night' : ''}`}
      style={{ backgroundColor: NIGHT }}
    >
      {/* ── 1단계 · 순차 등장 ──────────────────────────
          가운데의 ! 부터 시작해, 새 글자가 나올 때마다 위의 것들이 밀려 올라갑니다.
          그 밀림은 아래 motion.div 들의 layout 이 부드럽게 잇습니다. */}
      <Layer active={stage === 'alarm'}>
        <motion.div layout className="flex w-full max-w-[400px] flex-col items-center text-center">
          {/* 삼각형 · [경고] · 제목 — 셋이 같은 박자로 함께 깜빡입니다 */}
          <motion.div
            layout
            className="qr-blink-group flex w-full flex-col items-center"
          >
            <motion.div
              layout
              animate={{ scale: triScale }}
              transition={{ duration: 0.55, ease: GLIDE }}
              style={{ transformOrigin: '50% 50%' }}
            >
              <NeonTriangle still />
            </motion.div>

            {phase >= 1 && (
              <motion.span
                layout
                className="qr-neon-tag mt-[clamp(10px,2vh,16px)] px-3.5 py-0.5 text-[clamp(17px,4.8vw,25px)] font-bold tracking-[0.14em]"
                initial={{ opacity: 0, scale: 1.4, filter: 'blur(6px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                {reveal.alarm.badge}
              </motion.span>
            )}

            {phase >= 2 && (
              <motion.h2
                layout
                className="qr-neon-text mt-[clamp(6px,1.4vh,12px)] text-[clamp(26px,8vw,44px)] leading-[1.06] font-bold tracking-tight text-white"
              >
                {(() => {
                  let n = -1
                  return titleLines.map((line, li) => (
                    <span key={li} className="block">
                      {[...line].map((chr) => {
                        n += 1
                        return (
                          <motion.span
                            key={n}
                            className="inline-block"
                            initial={{ opacity: 0, y: '0.4em', scale: 1.6, filter: 'blur(8px)' }}
                            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                            transition={{ duration: 0.6, delay: n * (reveal.timing.titleCharMs / 1000), ease: EASE }}
                          >
                            {chr}
                          </motion.span>
                        )
                      })}
                    </span>
                  ))
                })()}
              </motion.h2>
            )}
          </motion.div>

          {/* 적은 값 — 한 줄씩 위에서 흘러내리듯 */}
          {phase >= 3 && (
            <motion.div layout className="mt-[clamp(12px,2.2vh,24px)] w-full" data-role="leak-record">
              {cards.map((card, i) => (
                <motion.div
                  key={card.id}
                  className="mb-[clamp(6px,1.2vh,10px)]"
                  initial={{ opacity: 0, y: -22, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.6, delay: i * (reveal.timing.rowGapMs / 1000), ease: EASE }}
                >
                  <p className="text-[clamp(10px,2.8vw,11px)] tracking-[0.24em] text-[#ff6a76]">
                    {card.label}
                  </p>
                  <p className="qr-neon-text min-h-[1.25em] text-[clamp(17px,5.4vw,25px)] leading-[1.25] font-bold break-all text-white">
                    {card.value}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* 이메일 밑 [다음] — 다 나온 뒤 떠오릅니다. 그 전에는 눌리지 않습니다.
              ★ 자동으로 넘어가지 않습니다. 관람객이 직접 누를 때까지 기다립니다. */}
          {phase >= 3 && (
            <motion.button
              onClick={toPunch}
              data-role="alarm-next"
              disabled={phase < 4}
              className="mt-[clamp(14px,2.4vh,26px)] h-[52px] w-full rounded-sm bg-white text-[17px] font-bold text-[#0a0b12]"
              style={{ pointerEvents: phase >= 4 ? 'auto' : 'none' }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: phase >= 4 ? 1 : 0, y: phase >= 4 ? 0 : 14 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              {reveal.alarm.nextButton}
            </motion.button>
          )}
        </motion.div>
      </Layer>

      {/* ── 2단계 · 마지막 문구 ─────────────────────────
          적은 값들은 사라지고, 이 문장만 서서히 떠오릅니다. */}
      <Layer active={stage === 'punch'}>
        <div className="flex w-full max-w-[400px] flex-col items-center text-center">
          <NeonTriangle small />

          <motion.div
            className="mt-7 w-full"
            initial="hidden"
            animate={stage === 'punch' ? 'show' : 'hidden'}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.34, delayChildren: 0.5 } } }}
          >
            {punchLines.map((line, i) => (
              <motion.p
                key={i}
                className="qr-neon-text text-[clamp(27px,7.6vw,34px)] leading-[1.24] font-bold tracking-tight break-keep text-white"
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  show: { opacity: 1, y: 0, transition: { duration: 1, ease: 'easeOut' } },
                }}
              >
                {fill(line, { count: cards.length, name })}
              </motion.p>
            ))}

            <motion.p
              className="mt-8 text-[14px] leading-relaxed text-white/55"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { duration: 1.1, ease: 'easeOut' } },
              }}
            >
              {lines(reveal.punch.note).map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </motion.p>

            {/*
              ★ 이 버튼을 빼지 마세요.
                이 화면에서 다 끝난 줄 알고 창을 닫아버리는 관람객이 있습니다.
                흰 버튼이 눈에 띄어야 뒤에 더 있다는 걸 압니다.
            */}
            <motion.button
              onClick={goQuestion}
              data-role="punch-next"
              className="mt-9 h-14 w-full rounded-sm bg-white text-[17px] font-bold text-[#0a0b12]"
              whileTap={{ scale: 0.97 }}
              variants={{
                hidden: { opacity: 0, y: 14 },
                show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
              }}
            >
              {reveal.punch.nextButton}
            </motion.button>
          </motion.div>
        </div>
      </Layer>

      {/* 램프가 정면을 볼 때 화면 전체가 물듭니다 */}
      {(stage === 'question' || stage === 'after') && (
        <div className="qr-screenflash">
          <div className="qr-screenflash-red" />
          <div className="qr-screenflash-blue" />
        </div>
      )}

      {/* ── 3단계 · 경광봉 + 질문 ────────────────────
          ★ 예전에는 아래로 밀어서 넘어갔습니다. 미는 걸 모르고 서 있는
            관람객이 있어 앞 화면과 똑같이 [다음] 버튼으로 바꿨습니다. */}
      <Layer active={stage === 'question'}>
        <div className="flex w-full max-w-[400px] flex-col items-center">
          <PoliceBar />

          <motion.div
            className="mt-12 w-full px-1 text-center"
            initial="hidden"
            animate={stage === 'question' ? 'show' : 'hidden'}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.28, delayChildren: 0.6 } } }}
          >
            {reveal.question.lines.map((line, i) => (
              <motion.p
                key={i}
                className="qr-lit text-[clamp(23px,6.8vw,28px)] leading-[1.34] font-bold tracking-tight break-keep text-white"
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: 'easeOut' } },
                }}
              >
                {line}
              </motion.p>
            ))}

            <motion.button
              onClick={() => setStage('after')}
              data-role="question-next"
              className="mt-10 h-14 w-full rounded-sm border border-white/45 text-[17px] font-bold text-white active:bg-white/10"
              whileTap={{ scale: 0.97 }}
              variants={{
                hidden: { opacity: 0, y: 14 },
                show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
              }}
            >
              {reveal.question.nextButton}
            </motion.button>
          </motion.div>
        </div>
      </Layer>

      {/* ── 4단계 · 마지막 한 마디 ──────────────────── */}
      <Layer active={stage === 'after'}>
        <motion.div
          className="w-full max-w-[400px] px-1 text-center"
          initial="hidden"
          animate={stage === 'after' ? 'show' : 'hidden'}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.3, delayChildren: 0.35 } } }}
        >
          <motion.p
            className="mb-3 text-[clamp(14px,4vw,17px)] leading-relaxed tracking-[0.06em] break-keep text-white/60"
            variants={{
              hidden: { opacity: 0, y: 14 },
              show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: 'easeOut' } },
            }}
          >
            {reveal.after.lead}
          </motion.p>

          {reveal.after.lines.map((line, i) => (
            <motion.p
              key={i}
              className="text-[clamp(23px,6.8vw,27px)] leading-[1.32] font-bold tracking-tight break-keep text-white"
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { duration: 0.95, ease: 'easeOut' } },
              }}
            >
              {line}
            </motion.p>
          ))}

          {/* 빈도 — 1조라는 숫자는 실감이 안 납니다. 사람이 셀 수 있는 단위로 한 번 더 */}
          <motion.p
            className="qr-neon-text mt-4 text-[clamp(17px,4.9vw,21px)] leading-snug font-bold break-keep text-[#ff8a92]"
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: { duration: 0.95, ease: 'easeOut' } },
            }}
          >
            {reveal.after.highlight}
          </motion.p>

          {/* ── 나에게로 ──────────────────────────────
              ★ 이 두 줄이 이 화면의 전부입니다. 숫자만 두면 남의 통계로 끝납니다.
                방금 본인이 적어 넘긴 그 줄 수를 그대로 되돌려줍니다. */}
          <motion.p
            className="mt-7 text-[clamp(24px,7vw,31px)] leading-[1.38] font-bold break-keep text-white"
            variants={{
              hidden: { opacity: 0, y: 14 },
              show: { opacity: 1, y: 0, transition: { duration: 1.1, ease: 'easeOut' } },
            }}
          >
            {reveal.after.closing.map((line, i) => (
              <span key={i} className="block">
                {fill(line, { count: cards.length })}
              </span>
            ))}
          </motion.p>

          {/* ★ 출처는 지우지 마세요. 공개 전시물에 박히는 숫자입니다. */}
          <motion.p
            className="mt-5 text-[clamp(11px,3vw,13px)] leading-relaxed break-keep text-white/40"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { duration: 1 } },
            }}
          >
            {reveal.after.source}
          </motion.p>

          <motion.button
            onClick={onNext}
            data-role="after-next"
            className="mt-10 h-14 w-full border border-white/40 text-[17px] font-bold text-white active:bg-white/10"
            whileTap={{ scale: 0.97 }}
            variants={{
              hidden: { opacity: 0, y: 14 },
              show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
            }}
          >
            {reveal.after.nextButton}
          </motion.button>
        </motion.div>
      </Layer>

      {/* 시네마틱 마감 — 가장자리를 눌러 가운데로 시선을 모으고, 옅은 그레인으로 CG 티를 뺍니다 */}
      <div className="qr-vignette" />
      <div className="qr-grain" />
    </div>
  )
}

/**
 * 경광봉(라이트바). 각진 하우징에 렌즈 모듈이 줄지어 박혀 있고,
 * 왼쪽 빨강 / 오른쪽 파랑이 번갈아 칩니다.
 * 생김새와 속도는 index.css 의 .qr-bar-* / .qr-beam-* 에 있습니다.
 */
function PoliceBar() {
  return (
    <div className="qr-bar-unit">
      {/* 빛은 하우징 좌·우로 뻗어나갑니다 */}
      <div className="qr-bar-anchor">
        <div className="qr-beam qr-beam-left">
          <div className="qr-beam-red" />
        </div>
        <div className="qr-beam qr-beam-right">
          <div className="qr-beam-blue" />
        </div>
        <div className="qr-halo qr-halo-l">
          <div className="qr-halo-red" />
        </div>
        <div className="qr-halo qr-halo-r">
          <div className="qr-halo-blue" />
        </div>
      </div>

      <div className="qr-bar">
        {['red', 'red', 'red', 'blue', 'blue', 'blue'].map((side, i) => (
          <div key={i} className={`qr-seg qr-seg-${side}`}>
            <div className="qr-seg-lens" />
          </div>
        ))}
      </div>

      <div className="qr-bar-lip" />
      <div className="qr-bar-feet">
        <span />
        <span />
      </div>

      <div className="qr-bar-floor">
        <div className="qr-floor-red" />
        <div className="qr-floor-blue" />
      </div>
    </div>
  )
}

/**
 * 화면 한 겹. 겹쳐 놓고 투명도만 바꿔서 교차시킵니다(빈 화면이 한 프레임도 안 생기게).
 * AnimatePresence 의 exit 는 React 19 + framer-motion 12 조합에서
 * 전환이 끝나지 않고 화면이 멈추는 경우가 있어 쓰지 않습니다.
 *
 * ★ 바깥이 스크롤, 안이 가운데 정렬입니다. 한 겹으로 합치면 안 됩니다 —
 *   justify-center 를 스크롤 상자에 직접 걸면 내용이 길어졌을 때 위쪽이
 *   스크롤로 닿지 않습니다. 휴대폰을 가로로 눕히면 실제로 그렇게 됩니다.
 */
function Layer({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <motion.div
      className="absolute inset-0 overflow-y-auto overscroll-contain"
      style={{ pointerEvents: active ? 'auto' : 'none' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex min-h-full flex-col items-center justify-center px-5 py-[clamp(12px,2.5vh,24px)]">
        {children}
      </div>
    </motion.div>
  )
}
