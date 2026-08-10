import { motion } from 'framer-motion'
import { form } from '../lib/content'
import { unlockAudio } from '../lib/alarm'
import { lines } from '../lib/format'
import Mascot from '../components/Mascot'

interface Props {
  onStart: () => void
}

/**
 * [0] 시작 화면. QR을 찍으면 가장 먼저 뜹니다.
 *
 * ★ 여기도 응모 폼과 마찬가지로 평범해야 합니다.
 *   마스코트가 뿅 하고 나오는 것 말고는 꾸미지 마세요.
 *   관람객이 "어? 뭔가 다른데" 하고 경계하면 기획 전체가 무너집니다.
 */
export default function IntroScreen({ onStart }: Props) {
  const handleStart = () => {
    // 관람객이 화면을 처음 건드리는 순간입니다.
    // 브라우저는 이때 소리를 열어줍니다 — 빨간 화면 사이렌을 쓰려면 여기서 해야 합니다.
    unlockAudio()
    onStart()
  }

  return (
    <div className="min-h-dvh bg-[#f4f5f7]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center bg-white px-6 py-10">
        <motion.p
          className="text-center text-[16px] text-gray-500"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {form.header.eventName}
        </motion.p>

        <motion.h1
          className="mt-1 text-center text-[24px] leading-snug font-bold text-gray-900"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          {form.header.title}
        </motion.h1>

        {/* 뿅 — 작게 움츠렸다가 튀어나옵니다 */}
        <motion.div
          className="mt-9 flex justify-center"
          initial={{ scale: 0.2, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 13, delay: 0.3 }}
        >
          {/* 튀어나온 뒤로는 천천히 위아래로 떠 있습니다 */}
          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            <Mascot size={152} />
          </motion.div>
        </motion.div>

        <motion.p
          className="mt-9 text-center text-[17px] leading-relaxed text-gray-600"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.85 }}
        >
          {lines(form.header.description).map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </motion.p>

        <motion.button
          onClick={handleStart}
          className="mt-9 h-14 w-full rounded-md bg-[#1b64da] text-[17px] font-bold text-white active:bg-[#164fb0]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 1 }}
        >
          {form.intro.button}
        </motion.button>
      </div>
    </div>
  )
}
