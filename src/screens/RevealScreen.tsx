import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
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
type Stage = 'alarm' | 'punch' | 'question'

const RED = '#a00d14'
// 경광등 화면은 바탕이 어두워야 빨강·파랑이 살아납니다
const NIGHT = '#0a0b12'

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

/** NO. 2026-0908-1423 — 꾸며낸 번호가 아니라 지금 접속한 시각입니다. */
function caseNumber(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

export default function RevealScreen({ answers, onNext }: Props) {
  const cards = useMemo(() => buildCards(answers), [answers])
  const [stage, setStage] = useState<Stage>('alarm')
  const alarming = stage === 'alarm' || stage === 'punch'
  const reduced = usePrefersReducedMotion()

  // 유출 기록에 한 줄씩 찍힐 문장들 — "이름: 홍길동"
  const rows = useMemo(() => cards.map((c) => `${c.label}: ${c.value}`), [cards])
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

  const caseNo = useMemo(() => caseNumber(new Date()), [])

  // 아래로 미는 동안 화면 요소가 같이 따라 움직입니다.
  // 경광봉과 글씨의 이동 속도를 다르게 줘서 깊이감이 생깁니다.
  //
  // ⚠️ 입력 범위는 반드시 0 에서 시작해 1 로 끝나야 합니다.
  //    [0, 0.55] 처럼 중간에서 끊으면 값이 갱신되지 않아 글자가 통째로 사라집니다.
  //    중간을 조절하고 싶으면 아래처럼 정거장을 더 찍으세요.
  const scrollRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ container: scrollRef })
  const barY = useTransform(scrollYProgress, [0, 1], [0, -60])
  const questionY = useTransform(scrollYProgress, [0, 1], [0, -95])
  // 완전히 사라지지 않습니다 — 화면 밖으로 밀려나는 것만으로 충분합니다
  const leavingOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.7, 0.4])
  const cueOpacity = useTransform(scrollYProgress, [0, 0.25, 1], [1, 0, 0])
  const afterY = useTransform(scrollYProgress, [0, 1], [70, 0])
  const afterOpacity = useTransform(scrollYProgress, [0, 0.15, 0.55, 1], [0, 0.15, 1, 1])

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
      className="fixed inset-0 overflow-hidden"
      style={{
        backgroundColor: alarming ? RED : NIGHT,
        transition: 'background-color 260ms ease',
      }}
    >
      {/* ── 경광등 ────────────────────────────────────
          좌우에서 번갈아 1초 주기로 밝아집니다.
          ⚠️ 이 속도를 올리지 마세요. 빠른 적색 점멸은 광과민성 발작을 유발할 수 있고,
             불특정 다수·미성년 관람객이 오는 부스입니다. */}
      {alarming && (
        <>
          <Beacon position="12% 26%" delay={0} />
          <Beacon position="88% 26%" delay={0.5} />
        </>
      )}

      {/* ── 1단계 · 유출 기록 ──────────────────────────
          사건 기록처럼 생긴 판에, 참가자가 방금 적은 값이 한 글자씩 찍힙니다.
          "내가 적은 그 글자"가 눈앞에서 타이핑되는 것이 이 화면의 전부입니다. */}
      <Layer active={stage === 'alarm'}>
        <div className="w-full max-w-[400px]">
          <span className="qr-beacon inline-block bg-white px-2 py-0.5 text-[13px] font-bold tracking-[0.12em] text-[#a00d14]">
            {reveal.alarm.badge}
          </span>

          <h2 className="mt-3 text-[clamp(32px,9vw,42px)] leading-[1.1] font-black tracking-tight text-white">
            {reveal.alarm.title}
          </h2>

          <p className="mt-1.5 text-[13px] tracking-[0.14em] text-white/45">
            {reveal.alarm.caseLabel} {caseNo}
          </p>

          <div className="mt-4 h-px w-full bg-white/35" />

          <div className="mt-4 space-y-2">
            {rows.map((full, i) => {
              // "이름: " 까지는 흐리게, 그 뒤 값은 굵고 하얗게
              const labelEnd = cards[i].label.length + 2
              const shown = full.slice(0, typed[i] ?? 0)
              return (
                <p key={cards[i].id} className="text-[17px] leading-snug break-all">
                  <span className="text-white/55">{shown.slice(0, labelEnd)}</span>
                  <span className="font-bold text-white">{shown.slice(labelEnd)}</span>
                  {i === cursorLine && <span className="qr-caret text-white">|</span>}
                </p>
              )
            })}
          </div>
        </div>
      </Layer>

      {/* ── 2단계 · 큰 글씨 한 방 ─────────────────────── */}
      <Layer active={stage === 'punch'}>
        <div className={`w-full max-w-[400px] ${stage === 'punch' ? 'qr-jolt' : ''}`}>
          <motion.div
            initial="hidden"
            animate={stage === 'punch' ? 'show' : 'hidden'}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.11 } },
            }}
          >
            {punchLines.map((line, i) => (
              <motion.p
                key={i}
                className="text-[clamp(27px,7.6vw,34px)] leading-[1.16] font-black tracking-tight break-keep text-white"
                variants={{
                  hidden: { opacity: 0, y: 26, skewY: 3 },
                  show: {
                    opacity: 1,
                    y: 0,
                    skewY: 0,
                    transition: { duration: 0.38, ease: 'easeOut' },
                  },
                }}
              >
                {fill(line, { count: cards.length, name })}
              </motion.p>
            ))}
            <motion.p
              className="mt-7 text-[15px] leading-relaxed text-white/60"
              variants={{
                hidden: { opacity: 0, y: 14 },
                show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
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
              className="mt-9 h-14 w-full rounded-sm bg-white text-[17px] font-bold text-[#a00d14]"
              whileTap={{ scale: 0.97 }}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
              }}
            >
              {reveal.punch.nextButton}
            </motion.button>
          </motion.div>
        </div>
      </Layer>

      {/* 램프가 정면을 볼 때 화면 전체가 물듭니다 */}
      {stage === 'question' && (
        <div className="qr-screenflash">
          <div className="qr-screenflash-red" />
          <div className="qr-screenflash-blue" />
        </div>
      )}

      {/* ── 3·4단계 · 경광등 + 질문 → 아래로 밀면 마지막 한 마디 ── */}
      <motion.div
        className="absolute inset-0"
        style={{ pointerEvents: stage === 'question' ? 'auto' : 'none' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: stage === 'question' ? 1 : 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* 한 화면씩 딱딱 걸리도록 스냅을 겁니다 — 중간에 어정쩡하게 멈추지 않게 */}
        <div
          ref={scrollRef}
          className="h-full snap-y snap-mandatory overflow-x-hidden overflow-y-auto overscroll-contain"
        >
          <section className="relative flex h-full snap-start flex-col items-center justify-center overflow-hidden px-5">
            {/* 스크롤하면 경광봉과 글씨가 서로 다른 속도로 따라 올라갑니다 */}
            <motion.div style={{ y: barY, opacity: leavingOpacity }}>
              <PoliceBar />
            </motion.div>

            {/* 한 줄씩 밀려 올라오고, 그 뒤로는 경광봉 불빛을 받아 밝아졌다 어두워집니다 */}
            <motion.div
              className="mt-12 w-full max-w-[400px] px-1 text-center"
              style={{ y: questionY, opacity: leavingOpacity }}
            >
              <motion.div
                initial="hidden"
                animate={stage === 'question' ? 'show' : 'hidden'}
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
                }}
              >
                {reveal.question.lines.map((line, i) => (
                  <motion.p
                    key={i}
                    className="qr-lit text-[28px] leading-[1.32] font-black tracking-tight text-white"
                    variants={{
                      hidden: { opacity: 0, y: 22 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
                    }}
                  >
                    {line}
                  </motion.p>
                ))}
              </motion.div>
            </motion.div>

            <motion.div style={{ opacity: cueOpacity }}>
              <ScrollCue label={reveal.question.scrollCue} />
            </motion.div>
          </section>

          <section className="flex h-full snap-start flex-col items-center justify-center overflow-hidden px-5">
            {/* 미는 만큼 아래에서 올라오면서 진해집니다 */}
            <motion.div
              className="w-full max-w-[400px] px-1 text-center"
              style={{ y: afterY, opacity: afterOpacity }}
            >
              <p className="mb-6 text-[19px] leading-relaxed text-white/70">
                {reveal.after.lead}
              </p>
              {reveal.after.lines.map((line, i) => (
                <p
                  key={i}
                  className="text-[27px] leading-[1.32] font-black tracking-tight text-white"
                >
                  {line}
                </p>
              ))}
              <p className="mt-6 text-[13px] leading-relaxed text-white/40">
                {reveal.after.source}
              </p>
              <button
                onClick={onNext}
                className="mt-10 h-14 w-full border border-white/40 text-[17px] font-bold text-white active:bg-white/10"
              >
                {reveal.after.nextButton}
              </button>
            </motion.div>
          </section>
        </div>
      </motion.div>

      {/* 시네마틱 마감 — 가장자리를 눌러 가운데로 시선을 모으고, 옅은 그레인으로 CG 티를 뺍니다 */}
      <div className="qr-vignette" />
      <div className="qr-grain" />
    </div>
  )
}

/** 아래로 밀라는 신호. 못 보고 서 있는 관람객이 생기면 안 되니 계속 움직입니다. */
function ScrollCue({ label }: { label: string }) {
  return (
    <div className="qr-cue pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-1 text-white/80">
      <span className="text-[16px] font-bold">{label}</span>
      <svg width="26" height="16" viewBox="0 0 26 16" aria-hidden="true">
        <path
          d="M3 3l10 10L23 3"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
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

/** 1단계 경광등 한 짝. 좌우가 번갈아 밝아집니다(주기는 index.css 의 .qr-beacon). */
function Beacon({ position, delay }: { position: string; delay: number }) {
  return (
    <div
      className="qr-beacon pointer-events-none absolute inset-0"
      style={{
        background: `radial-gradient(circle at ${position}, rgba(255,86,86,0.95), rgba(255,0,0,0) 58%)`,
        animationDelay: `${delay}s`,
      }}
    />
  )
}

/**
 * 화면 한 겹. 겹쳐 놓고 투명도만 바꿔서 교차시킵니다(빈 화면이 한 프레임도 안 생기게).
 * AnimatePresence 의 exit 는 React 19 + framer-motion 12 조합에서
 * 전환이 끝나지 않고 화면이 멈추는 경우가 있어 쓰지 않습니다.
 */
function Layer({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col justify-center px-5"
      style={{ pointerEvents: active ? 'auto' : 'none' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.35 }}
    >
      {children}
    </motion.div>
  )
}
