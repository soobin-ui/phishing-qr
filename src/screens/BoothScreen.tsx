import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { ui } from '../lib/content'
import { lines } from '../lib/format'
import Mascot from '../components/Mascot'

/** 아래에서 밀려 올라오며 나타나는 공통 등장 동작 */
const rise: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

/**
 * [4] 부스 유도.
 * 경광등이 꺼지고 조용해집니다. 여기서 할 일은 딱 두 가지 —
 * 태블릿 체험존으로 보내고, 경품 받아가라고 알려주는 것.
 */
export default function BoothScreen() {
  const booth = ui.booth

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0a0b12]">
      {/* 마감 효과는 흰 안내 띠 아래에 깔아야 띠가 회색으로 죽지 않습니다 */}
      <div className="qr-vignette" />
      <div className="qr-grain" />

      <motion.div
        className="relative flex h-full flex-col items-center justify-center px-6"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.13 } } }}
      >
        <motion.div variants={rise}>
          <Mascot size={106} outline={false} />
        </motion.div>

        <div className="mt-7 w-full max-w-[400px] text-center">
          {booth.lines.map((line, i) => (
            <motion.p
              key={i}
              variants={rise}
              className="text-[28px] leading-[1.3] font-black tracking-tight text-white"
            >
              {line}
            </motion.p>
          ))}

          <motion.p variants={rise} className="mt-5 text-[17px] leading-relaxed text-white/70">
            {lines(booth.sub).map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </motion.p>

          <motion.div
            variants={rise}
            className="mt-8 flex items-center justify-center gap-2.5 border border-white/25 px-4 py-4"
          >
            <motion.svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              aria-hidden="true"
              className="shrink-0"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path
                d="M3 11h15M12 5l6 6-6 6"
                fill="none"
                stroke="#ff5257"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
            <span className="text-[17px] leading-snug font-bold text-white">{booth.zone}</span>
          </motion.div>
        </div>
      </motion.div>

    </div>
  )
}
