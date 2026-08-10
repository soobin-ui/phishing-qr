import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { ui } from '../lib/content'

/** 아래에서 밀려 올라오며 나타나는 공통 등장 동작 */
const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

interface Props {
  onDone: () => void
}

/**
 * [2] 접수 완료 — 3초.
 * 이 3초는 다음 화면(빨간 화면)의 충격을 위한 뜸입니다. 시간을 줄이지 마세요.
 * 시간은 ui.json 의 complete.holdMs 에서 조절합니다.
 */
export default function CompleteScreen({ onDone }: Props) {
  const [done, setDone] = useState(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    // 0.9초 "접수 중" → 체크 표시 → 3초 뒤 다음 화면
    const toCheck = setTimeout(() => setDone(true), 900)
    const toNext = setTimeout(() => onDoneRef.current(), ui.complete.holdMs)
    return () => {
      clearTimeout(toCheck)
      clearTimeout(toNext)
    }
  }, [])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center">
        {done ? (
          <div className="flex h-20 w-20 scale-100 items-center justify-center rounded-full bg-[#1b64da] transition-transform duration-300">
            <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
              <path
                d="M10 20.5l7 7 13-15"
                fill="none"
                stroke="#fff"
                strokeWidth="3.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ) : (
          <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#1b64da]" />
        )}
      </div>

      {done ? (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
        >
          <motion.p
            variants={rise}
            className="mt-6 text-[19px] leading-relaxed font-bold text-gray-900"
          >
            {ui.complete.title}
          </motion.p>
          <motion.div variants={rise} className="mt-5 rounded-md bg-gray-50 px-5 py-4">
            {ui.complete.lines.map((line, i) => (
              <p key={i} className="text-[16px] leading-relaxed text-gray-600">
                {line}
              </p>
            ))}
          </motion.div>
        </motion.div>
      ) : (
        <p className="mt-6 text-[16px] text-gray-500">{ui.complete.processing}</p>
      )}
    </div>
  )
}
