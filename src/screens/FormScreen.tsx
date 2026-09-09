import { useState } from 'react'
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
import { checkAll, checkField } from '../lib/validate'
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
  /**
   * 제출을 눌렀을 때 문제가 있던 항목 — 팝업을 닫아도 빨간 테두리와 안내가 남습니다.
   * { 항목id: 안내문구 }
   */
  const [problems, setProblems] = useState<Record<string, string>>({})
  const [popupOpen, setPopupOpen] = useState(false)
  /** 형식이 틀린 게 섞여 있으면 팝업 제목이 달라집니다 */
  const [hasInvalid, setHasInvalid] = useState(false)

  const setValue = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
    // 고쳐서 통과되는 순간 그 항목의 빨간 테두리와 안내를 바로 거둡니다
    setProblems((prev) => {
      if (!(id in prev)) return prev
      const def = fields.find((f) => f.id === id)
      if (!def || checkField(def, value)) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  /** 팝업을 닫으면 문제가 있는 첫 칸으로 데려다 놓습니다 */
  const closePopup = () => {
    setPopupOpen(false)
    const first = fields.find((f) => f.id in problems)?.id
    if (!first) return
    const el = document.getElementById(first)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // 스크롤이 끝난 뒤에 커서를 넣어야 화면이 튀지 않습니다
    window.setTimeout(() => el?.focus({ preventScroll: true }), 320)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    // ★ 절대 원칙: 어떤 경우에도 폼이 실제로 전송되지 않게 막습니다.
    e.preventDefault()

    // 비었는지 + 형식이 맞는지 둘 다 봅니다(규칙은 form.json 의 rule, 검사는 lib/validate.ts).
    const found = checkAll(fields, answers)
    if (found.length > 0) {
      setProblems(Object.fromEntries(found.map(({ def, message }) => [def.id, message])))
      setHasInvalid(found.some(({ def }) => (answers[def.id] ?? '').trim() !== ''))
      setPopupOpen(true)
      return
    }

    // 브라우저는 화면을 건드리기 전에 소리를 내주지 않습니다.
    // 빨간 화면의 사이렌을 쓰려면 바로 이 탭에서 열어둬야 합니다.
    unlockAudio()

    onSubmit(answers)
  }

  // overflow-x-hidden — [응모하기] 뒤 금색 빛 번짐(blur)이 화면 밖으로 삐져나가
  // 가로 스크롤이 생기는 것을 막습니다. 장식이라 잘려도 됩니다.
  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#dbeafd]">
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
                  problem={problems[def.id]}
                  onChange={(v) => setValue(def.id, v)}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* ── 응모하기 ────────────────────────────
              ★ 이메일 바로 아래입니다. 사이에 아무것도 두지 마세요.
                망설일 틈 없이 누르게 하는 것이 이 화면의 전부입니다.
              ★ 버튼이 쉬지 않고 통통 튑니다(index.css의 ps-pop). */}
          <div className="relative mt-8">
            {/* 튈 때 같이 번지는 금색 빛 — 버튼 뒤에 깔립니다 */}
            <span className="ps-pop-ring pointer-events-none absolute inset-0 rounded-2xl bg-[#feca36]" />

            <div className="ps-pop relative">
              <button
                type="submit"
                className="ps-cta h-[58px] w-full rounded-2xl bg-[#feca36] text-[19px] font-bold text-[#1c2e63]"
              >
                {form.submitButton}
              </button>
            </div>
          </div>

          {/* 키보드가 올라온 상태에서도 제출 버튼까지 스크롤이 닿도록 여백을 둡니다 */}
          <div className="h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
        </form>
      </div>

      {/* ── 필수 항목 안내 팝업 ────────────────────────
          ★ 흔한 응모 폼이 띄우는 그 창처럼 보여야 합니다. 꾸미지 마세요. */}
      {popupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="required-popup-title"
        >
          <motion.div
            className="absolute inset-0 bg-black/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.16 }}
            onClick={closePopup}
          />

          <motion.div
            className="relative w-full max-w-[320px] rounded-2xl bg-white px-6 pt-7 pb-5 text-center shadow-[0_18px_40px_rgba(0,0,0,0.3)]"
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          >
            <p id="required-popup-title" className="text-[18px] leading-snug break-keep font-bold text-gray-900">
              {hasInvalid ? form.requiredPopup.invalidTitle : form.requiredPopup.title}
            </p>
            <p className="mt-2.5 text-[15px] leading-relaxed break-keep text-gray-600">
              {lines(form.requiredPopup.body).map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </p>

            {/* 어느 항목이 왜 걸렸는지 그대로 보여줍니다 */}
            <ul className="mt-4 space-y-2.5 rounded-xl bg-gray-50 px-4 py-3.5 text-left">
              {fields
                .filter((f) => f.id in problems)
                .map((f) => (
                  <li key={f.id}>
                    <p className="text-[15px] font-bold text-gray-800">
                      <span className="mr-1.5 text-[#e0342b]">*</span>
                      {f.label}
                    </p>
                    <p className="mt-0.5 pl-4 text-[14px] leading-snug break-keep text-gray-500">
                      {problems[f.id]}
                    </p>
                  </li>
                ))}
            </ul>

            <button
              type="button"
              onClick={closePopup}
              className="mt-5 h-12 w-full rounded-xl bg-[#263b7c] text-[16px] font-bold text-white active:bg-[#1c2e63]"
            >
              {form.requiredPopup.button}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}

// 탭하면 테두리가 파랗게 차오르고 살짝 떠오릅니다(입력 중인 칸이 어디인지 바로 보이게)
const inputClass =
  'w-full h-12 rounded-md border border-gray-300 bg-white px-3 text-gray-900 placeholder:text-gray-400 ' +
  'transition-[border-color,box-shadow,background-color] duration-200 ' +
  'focus:border-[#1b64da] focus:bg-[#f7faff] focus:shadow-[0_2px_10px_rgba(27,100,218,0.18)] focus:outline-none'

// 비워 둔 채 제출을 눌렀던 칸 — 어디를 안 적었는지 팝업을 닫은 뒤에도 보이게
const invalidClass = '!border-[#e0342b] !bg-[#fff6f5]'

// 드롭다운 오른쪽 화살표 (외부 이미지 요청이 생기지 않도록 인라인 SVG로 그립니다)
const caret =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1.5 6 6.5 11 1.5' fill='none' stroke='%23888' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/></svg>\")"

function Field({
  def,
  value,
  problem,
  onChange,
}: {
  def: FieldDef
  value: string
  /** 제출할 때 걸린 사유. 있으면 테두리를 빨갛게 하고 칸 아래에 그대로 적어줍니다 */
  problem?: string
  onChange: (value: string) => void
}) {
  const box = problem ? `${inputClass} ${invalidClass}` : inputClass

  return (
    <div>
      <label htmlFor={def.id} className="mb-1.5 block text-[16px] font-medium text-gray-800">
        {def.label}
        {def.required && (
          <span className="ml-1 text-[#e0342b]" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {def.type === 'select' ? (
        <select
          id={def.id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${box} appearance-none pr-9 ${value ? '' : 'text-gray-400'}`}
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
          className={box}
          aria-required={def.required || undefined}
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

      {problem && (
        <p className="mt-1.5 text-[14px] leading-snug break-keep text-[#e0342b]">{problem}</p>
      )}
    </div>
  )
}
