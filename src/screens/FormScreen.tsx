import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { form, fields, ui } from '../lib/content'
import Mascot from '../components/Mascot'
import { unlockAudio } from '../lib/alarm'
import { digitsOnly, formatPhone, lines } from '../lib/format'
import type { Answers, FieldDef } from '../types'

interface Props {
  onSubmit: (answers: Answers) => void
}

/** 입력 항목이 위에서 차례로 내려오는 동작 */
const fieldRise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
}

/**
 * [1] 응모 폼.
 *
 * ★ 이 화면은 절대 특별해 보이면 안 됩니다.
 *   흰 배경 / 기본 입력창 / 파란 제출 버튼. 그 이상 꾸미지 마세요.
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
    <div className="min-h-dvh bg-[#f4f5f7]">
      <div className="mx-auto w-full max-w-[430px] bg-white min-h-dvh">
        <header className="border-b border-gray-200 px-5 pt-7 pb-5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] text-gray-500">{form.header.eventName}</p>
              <h1 className="mt-1 text-[22px] leading-snug font-bold text-gray-900">
                {form.header.title}
              </h1>
              <p className="mt-3 text-[16px] leading-relaxed text-gray-600">
                {lines(form.header.description).map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </p>
            </div>
            <div className="mt-1 shrink-0">
              <Mascot size={78} />
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

          <motion.button
            type="submit"
            className="mt-7 h-14 w-full rounded-md bg-[#1b64da] text-[17px] font-bold text-white active:bg-[#164fb0]"
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          >
            {form.submitButton}
          </motion.button>

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
