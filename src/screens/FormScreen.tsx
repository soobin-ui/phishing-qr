import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { form, fields, ui } from '../lib/content'
import PosterBackground from '../components/PosterBackground'
import type { AvoidBox } from '../components/PosterBackground'
import mascotLeft from '../assets/mascot-left-nogift.webp'
import mascotRight from '../assets/mascot-right-nogift.webp'
import { unlockAudio } from '../lib/alarm'
import { digitsOnly, formatPhone, lines } from '../lib/format'
import type { Answers, FieldDef } from '../types'

interface Props {
  onSubmit: (answers: Answers) => void
}

/** 별빛을 비울 자리(% 단위) — 머리글은 글자가 왼쪽에 몰려 있습니다. */
const SPARK_FREE: AvoidBox[] = [{ x1: 0, y1: 0, x2: 57, y2: 96 }]

/** 입력 항목이 위에서 차례로 내려오는 동작 */
const fieldRise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
}

/**
 * [1] 응모 폼.
 *
 * ★ 머리글만 홍보 포스터의 얼굴을 씁니다(하늘색·캐릭터·금색 아크).
 *   부스 앞 포스터 → 시작 화면 → 이 화면이 같은 얼굴이라야
 *   "그 부스가 만든 공식 응모 폼"으로 읽힙니다.
 *
 * ★ 대신 입력 영역은 흰 카드 안에 그대로 둡니다.
 *   하늘색 배경 위에 입력창을 올리면 읽기 어렵고,
 *   무엇보다 '어디서나 보던 평범한 응모 폼'이라는 느낌이 깨집니다.
 *
 * ★ 입력값은 이 컴포넌트의 useState(메모리)에만 담깁니다.
 *   fetch·localStorage·쿠키·콘솔 출력 어느 것도 쓰지 않습니다.
 */
export default function FormScreen({ onSubmit }: Props) {
  const [answers, setAnswers] = useState<Answers>({})
  const [agreedRequired, setAgreedRequired] = useState(false)
  const [agreedOptional, setAgreedOptional] = useState(false)
  const [noticeOpen, setNoticeOpen] = useState(false)
  const [consentError, setConsentError] = useState(false)
  const consentRef = useRef<HTMLDivElement>(null)

  const setValue = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    // ★ 절대 원칙: 어떤 경우에도 폼이 실제로 전송되지 않게 막습니다.
    e.preventDefault()

    // 입력 항목은 전부 비워도 통과시킵니다(유효성 검사 없음).
    // 다만 [필수] 동의는 일반 응모 폼과 똑같이 체크를 요구합니다.
    if (!agreedRequired) {
      setConsentError(true)
      consentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    // 브라우저는 화면을 건드리기 전에 소리를 내주지 않습니다.
    // 빨간 화면의 사이렌을 쓰려면 바로 이 탭에서 열어둬야 합니다.
    unlockAudio()

    onSubmit(answers)
  }

  return (
    <div className="min-h-dvh bg-[#dbeafd]">
      <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-white">
        {/* ── 머리글 — 포스터의 얼굴 ───────────────────
            행사명 배지가 한 줄, 그 아래 왼쪽은 글자 / 오른쪽은 캐릭터 둘.

            ★ 여기서는 색종이(confetti)도 금색 아크(bottom)도 끕니다 —
              좁은 머리글에서는 글자 위를 지나가 가려버립니다.
              색종이와 아크가 살아 있는 곳은 시작 화면과 부스 유도. */}
        <header className="relative overflow-hidden px-5 pt-7 pb-2">
          <PosterBackground bottom="none" confetti={false} avoidSparks={SPARK_FREE} />

          <div className="relative z-10">
            <span className="inline-block rounded-full bg-[#263b7c] px-4 py-1.5 text-[15px] font-bold text-white shadow-[0_3px_8px_rgba(24,44,96,0.28)]">
              {form.intro.badge}
            </span>

            <div className="mt-2.5 flex gap-2">
              {/* 왼쪽 — 글자 */}
              <div className="min-w-0 flex-1">
                <h1 className="ps-title-shadow leading-[1.15] font-bold [--ps-stroke:5px]">
                  <span className="ps-outline block text-[27px] text-[#feca36]">
                    {form.intro.titleAccent}
                  </span>
                  <span className="ps-outline block text-[27px] text-white">
                    {form.intro.titleMain}
                  </span>
                </h1>

                <p className="mt-3 text-[clamp(13px,3.8vw,15px)] leading-relaxed font-medium text-[#1c2e63]">
                  {lines(form.header.description).map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
                </p>
              </div>

              {/* 오른쪽 — 캐릭터 둘.
                  ★ 발밑 선물상자를 뺀 이미지(-nogift)를 씁니다. 좁은 칸이라
                    상자까지 넣으면 둘 사이에서 겹쳐 뭉개집니다.
                  ★ 폭 비율(56% : 49%)이 포스터에서의 크기 비입니다. 한쪽만 바꾸지 마세요.
                    오른쪽 캐릭터를 -ml-2 로 살짝 겹쳐 세워 그만큼 둘 다 크게 넣었습니다. */}
              <div className="flex w-[46%] shrink-0 items-end justify-end self-end">
                <img src={mascotLeft} alt="" className="ps-mascot-shadow w-[56%]" />
                <img src={mascotRight} alt="" className="ps-mascot-shadow -ml-2 w-[49%]" />
              </div>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} noValidate autoComplete="off" className="px-5 py-6">
          {/* 항목이 위에서부터 차례로 내려옵니다. 흔한 응모 폼이 이 정도는 합니다 —
              여기서 더 화려하게 만들면 관람객이 경계합니다. */}
          <motion.div
            className="space-y-5"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          >
            {fields.map((def) => (
              <motion.div key={def.id} variants={fieldRise}>
                <Field
                  def={def}
                  value={answers[def.id] ?? ''}
                  onChange={(v) => setValue(def.id, v)}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* ── 동의 영역 ─────────────────────────────── */}
          <div ref={consentRef} className="mt-8 border-t border-gray-200 pt-5">
            {/* [자세히] 버튼은 label 바깥에 둡니다 — 안에 두면 누를 때 체크박스까지 켜집니다 */}
            <div className="flex items-start gap-2.5">
              <label className="flex flex-1 items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={agreedRequired}
                  onChange={(e) => {
                    setAgreedRequired(e.target.checked)
                    if (e.target.checked) setConsentError(false)
                  }}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#1b64da]"
                />
                <span className="flex-1 text-[16px] leading-relaxed text-gray-800">
                  {form.consent.requiredLabel}
                </span>
              </label>
              <button
                type="button"
                onClick={() => setNoticeOpen((v) => !v)}
                className="shrink-0 rounded border border-gray-300 px-2 py-1 text-[14px] text-gray-500"
              >
                {form.consent.detailButton}
              </button>
            </div>

            {noticeOpen && (
              <motion.div
                className="overflow-hidden"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <div className="mt-3 rounded-md bg-gray-50 p-4 text-[15px] leading-relaxed text-gray-600">
                  {lines(form.consent.notice).map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {consentError && (
              <motion.p
                className="mt-2 pl-7 text-[15px] text-red-600"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22 }}
              >
                {form.consent.requiredError}
              </motion.p>
            )}

            <label className="mt-4 flex items-start gap-2.5">
              <input
                type="checkbox"
                checked={agreedOptional}
                onChange={(e) => setAgreedOptional(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[#1b64da]"
              />
              <span className="flex-1 text-[16px] leading-relaxed text-gray-800">
                {form.consent.optionalLabel}
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="ps-cta mt-7 h-[58px] w-full rounded-2xl bg-[#feca36] text-[18px] font-bold text-[#1c2e63]"
          >
            {form.submitButton}
          </button>

          {/* 키보드가 올라온 상태에서도 제출 버튼까지 스크롤이 닿도록 여백을 둡니다 */}
          <div className="h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
        </form>
      </div>
    </div>
  )
}

// 탭하면 테두리가 파랗게 차오르고 살짝 떠오릅니다(입력 중인 칸이 어디인지 바로 보이게)
const inputClass =
  'w-full h-12 rounded-md border border-gray-300 bg-white px-3 text-gray-900 placeholder:text-gray-400 ' +
  'transition-[border-color,box-shadow,background-color] duration-200 ' +
  'focus:border-[#1b64da] focus:bg-[#f7faff] focus:shadow-[0_2px_10px_rgba(27,100,218,0.18)] focus:outline-none'

// 드롭다운 오른쪽 화살표 (외부 이미지 요청이 생기지 않도록 인라인 SVG로 그립니다)
const caret =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1.5 6 6.5 11 1.5' fill='none' stroke='%23888' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/></svg>\")"

function Field({
  def,
  value,
  onChange,
}: {
  def: FieldDef
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label htmlFor={def.id} className="mb-1.5 block text-[16px] font-medium text-gray-800">
        {def.label}
      </label>

      {def.type === 'select' ? (
        <select
          id={def.id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} appearance-none pr-9 ${value ? '' : 'text-gray-400'}`}
          style={{
            backgroundImage: caret,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
          }}
        >
          <option value="">{ui.selectPlaceholder}</option>
          {def.options?.map((o) => (
            <option key={o} value={o} className="text-gray-900">
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={def.id}
          className={inputClass}
          placeholder={def.placeholder}
          autoComplete="off"
          value={value}
          type={def.type === 'phone' ? 'tel' : def.type === 'email' ? 'email' : 'text'}
          inputMode={
            def.type === 'phone' || def.type === 'digits'
              ? 'numeric'
              : def.type === 'email'
                ? 'email'
                : 'text'
          }
          autoCapitalize={def.type === 'email' ? 'none' : undefined}
          spellCheck={def.type === 'email' ? false : undefined}
          onChange={(e) => {
            const raw = e.target.value
            if (def.type === 'phone') onChange(formatPhone(raw))
            else if (def.type === 'digits') onChange(digitsOnly(raw, def.maxLength ?? 20))
            else onChange(raw)
          }}
        />
      )}
    </div>
  )
}
