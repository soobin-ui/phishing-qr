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
 *   1) 경광등 + 사이렌 + 적은 값이 한 줄씩 '전송'된다
 *   2) 큰 글씨 한 방
 *   3) 사이렌 이모지가 반짝이며 질문 하나
 */
type Stage = 'alarm' | 'punch' | 'question' | 'after'

// 1·2단계(유출 기록·마지막 문구)와 경광봉 화면 모두 검은 바탕입니다
const NIGHT = '#05060a'

/**
 * 한 줄씩 타자기처럼 찍습니다.
 * 되돌려주는 값은 줄마다 '지금까지 찍힌 글자 수'입니다.
 *
 * ★ 이 화면에서만 JS 로 애니메이션을 굴립니다 — 한 번 지나가고 끝나는 연출이라
 *   무한 반복 애니메이션(경광등 등)을 CSS 로 두는 원칙과는 별개입니다.
 * ★ 기기에서 '동작 줄이기'를 켜 두었으면 타자 없이 한 번에 다 보여줍니다.
 */
function useTypewriter(texts: string[], charMs: number, lineGapMs: number, reduced: boolean) {
  const key = JSON.stringify(texts)
  const [typed, setTyped] = useState<number[]>(() => texts.map(() => 0))

  useEffect(() => {
    if (reduced) {
      setTyped(texts.map((t) => t.length))
      return
    }

    setTyped(texts.map(() => 0))
    let line = 0
    let ch = 0
    let timer = 0

    const tick = () => {
      if (line >= texts.length) return

      // ★ 지금 줄·글자 수를 상수로 붙잡아 두고 넘깁니다.
      //   setTyped 안에서 line·ch 를 그대로 읽으면 안 됩니다 —
      //   React 가 그 함수를 나중에 실행하는데, 그때는 이미 다음 줄로 넘어가 있어서
      //   각 줄이 마지막 한 글자를 남기고 멈춰버립니다.
      const atLine = line
      const atCh = ch + 1
      ch = atCh

      setTyped((prev) => {
        const next = [...prev]
        next[atLine] = atCh
        return next
      })

      if (atCh >= texts[atLine].length) {
        line += 1
        ch = 0
        timer = window.setTimeout(tick, lineGapMs)
      } else {
        timer = window.setTimeout(tick, charMs)
      }
    }

    timer = window.setTimeout(tick, lineGapMs)
    return () => clearTimeout(timer)
    // texts 는 매번 새 배열이라 내용(key)으로 비교합니다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, charMs, lineGapMs, reduced])

  return typed
}

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
 */
function NeonTriangle({ small = false }: { small?: boolean }) {
  const w = small ? 'min(104px, 12vh, 30vw)' : 'min(150px, 17vh, 40vw)'
  return (
    <svg
      className="qr-neon"
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

export default function RevealScreen({ answers, onNext }: Props) {
  const cards = useMemo(() => buildCards(answers), [answers])
  const [stage, setStage] = useState<Stage>('alarm')
  const alarming = stage === 'alarm' || stage === 'punch'
  const reduced = usePrefersReducedMotion()

  // 찍히는 건 값뿐입니다. 라벨은 그 줄 차례가 오면 바로 떠 있습니다
  // (라벨까지 한 글자씩 찍으면 값이 나오기 전에 죽는 시간이 생깁니다).
  const rows = useMemo(() => cards.map((c) => c.value), [cards])
  const typed = useTypewriter(
    rows,
    reveal.timing.typeCharMs,
    reveal.timing.typeLineGapMs,
    reduced,
  )
  // 지금 찍히고 있는 줄(커서를 붙일 자리). 다 찍혔으면 -1.
  const cursorLine = typed.findIndex((n, i) => n < rows[i].length)

  // 다 찍는 데 걸리는 시간 — 큰 글씨로 넘어가는 시점이 여기에 맞춰집니다
  const typingMs = useMemo(
    () =>
      reduced
        ? 400
        : rows.reduce(
            (sum, t) => sum + t.length * reveal.timing.typeCharMs + reveal.timing.typeLineGapMs,
            reveal.timing.typeLineGapMs,
          ),
    [rows, reduced],
  )


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

  useEffect(() => {
    const timers: number[] = []
    const T = reveal.timing

    const stopAlarm = reveal.sound.enabled ? startAlarm(reveal.sound.volume) : () => {}
    stopAlarmRef.current = stopAlarm
    buzz([120, 90, 120, 90, 120, 90, 600])

    let at = typingMs + T.alarmHoldMs
    timers.push(
      window.setTimeout(() => {
        setStage('punch')
        buzz(300)
      }, at),
    )
    at += T.punchMs

    timers.push(window.setTimeout(goQuestion, at))

    return () => {
      timers.forEach(clearTimeout)
      if (tailTimerRef.current) clearTimeout(tailTimerRef.current)
      stopAlarm()
      buzz(0)
    }
  }, [typingMs, goQuestion])

  return (
    <div
      className={`fixed inset-0 overflow-hidden ${alarming ? 'qr-night' : ''}`}
      style={{ backgroundColor: NIGHT }}
    >
      {/* ── 1단계 · 유출 기록 ──────────────────────────
          검은 화면에 빨간 네온 경고가 깜빡이고, 그 아래로
          참가자가 방금 적은 값이 한 글자씩 찍힙니다.
          "내가 적은 그 글자"가 눈앞에서 타이핑되는 것이 이 화면의 전부입니다. */}
      <Layer active={stage === 'alarm'}>
        <div
          className="flex w-full max-w-[400px] flex-col items-center text-center"
          data-role="leak-record"
        >
          <NeonTriangle />

          <span className="qr-neon qr-neon-tag mt-[clamp(10px,2vh,16px)] px-3.5 py-0.5 text-[clamp(17px,4.8vw,25px)] font-bold tracking-[0.14em]">
            {reveal.alarm.badge}
          </span>

          <h2 className="qr-neon-text mt-[clamp(8px,1.6vh,12px)] text-[clamp(26px,8vw,44px)] leading-[1.06] font-bold tracking-tight text-white">
            {reveal.alarm.titleLines.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h2>

          {/* 적은 값 — 가운데 정렬, 한 줄씩 */}
          <div className="mt-[clamp(14px,3vh,24px)] w-full">
            {cards.map((card, i) => {
              // 아직 차례가 오지 않은 줄은 라벨도 감춥니다 — 몇 개나 더 남았는지
              // 미리 알려주지 않는 쪽이 조입니다.
              const started = cursorLine === -1 || i <= cursorLine
              return (
                <div key={card.id} className="mb-[clamp(6px,1.2vh,10px)]">
                  <p
                    className="text-[clamp(10px,2.8vw,11px)] tracking-[0.24em] text-[#ff6a76] transition-opacity duration-300"
                    style={{ opacity: started ? 1 : 0 }}
                  >
                    {card.label}
                  </p>
                  <p className="qr-neon-text min-h-[1.25em] text-[clamp(17px,5.4vw,25px)] leading-[1.25] font-bold break-all text-white">
                    {card.value.slice(0, typed[i] ?? 0)}
                    {i === cursorLine && <span className="qr-caret">|</span>}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
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
            className="mb-6 text-[18px] leading-relaxed text-white/70"
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

          {/* 하루치로 환산한 값 — 큰 숫자는 실감이 안 나므로 하루 단위로 한 번 더 */}
          <motion.p
            className="qr-neon-text mt-5 text-[clamp(18px,5.2vw,22px)] leading-snug font-bold break-keep text-[#ff8a92]"
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: { duration: 0.95, ease: 'easeOut' } },
            }}
          >
            {reveal.after.highlight}
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
