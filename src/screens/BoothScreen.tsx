import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { ui } from '../lib/content'
import { lines } from '../lib/format'
import PosterBackground from '../components/PosterBackground'
import mascotLeft from '../assets/mascot-left.webp'
import mascotRight from '../assets/mascot-right.webp'

/** 아래에서 밀려 올라오며 나타나는 공통 등장 동작 */
const rise: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

/**
 * [4] 부스 유도.
 * 경광등이 꺼지고 조용해집니다. 여기서 할 일은 딱 두 가지 —
 * 태블릿 체험존으로 보내고, 경품 받아가라고 알려주는 것.
 *
 * ★ 빨간 화면의 검은 배경에서 여기서 다시 포스터의 하늘색으로 돌아옵니다.
 *   놀란 사람을 부스 앞 현실(포스터·캐릭터)로 데려오는 자리라
 *   밝게 끝내는 편이 발걸음을 옮기게 만듭니다.
 */
export default function BoothScreen() {
  const booth = ui.booth

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#8fc4fb]">
      <PosterBackground />

      <motion.div
        className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pt-12 pb-7"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.13 } } }}
      >
        {/* ── 질문 ────────────────────────────────
            이 화면에서 관람객이 가져가야 할 문장은 이것 하나입니다. */}
        <motion.h1
          variants={rise}
          className="ps-title-shadow text-center leading-[1.2] font-bold [--ps-stroke:6px]"
        >
          {booth.lines.map((line, i) => (
            <span key={i} className="ps-outline block text-[clamp(27px,7.6vw,34px)] text-white">
              {line}
            </span>
          ))}
        </motion.h1>

        {/* 화면이 긴 기기에서 남는 공간을 질문 아래와 리본 아래로 나눠 갖습니다
            (시작 화면과 같은 이유 — 한쪽에 몰아주면 구멍처럼 보입니다) */}
        <div className="flex-[0.8]" />

        {/* ── 어디로 가면 되는지 ───────────────────── */}
        <motion.p
          variants={rise}
          className="ps-ribbon mx-auto bg-[#263b7c] px-8 py-3.5 text-center text-[16px] leading-relaxed font-medium text-white"
        >
          {lines(booth.sub).map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </motion.p>

        {/* ── 두 캐릭터 ───────────────────────────
            시작 화면과 같은 자리에 같은 크기로 다시 세웁니다. */}
        <motion.div
          variants={rise}
          className="ps-mascots relative flex min-h-0 flex-1 items-end justify-center gap-1 pt-4"
        >
          <img src={mascotLeft} alt="" className="ps-mascot-l ps-mascot-shadow self-end" />
          <img src={mascotRight} alt="" className="ps-mascot-r ps-mascot-shadow mb-[1.5%] self-end" />
        </motion.div>

        {/* ── 체험존 안내 ─────────────────────────
            누를 수 있는 버튼이 아닙니다 — 발걸음을 옮기라는 표지판입니다.
            체험이 끝난 사람의 눈이 마지막으로 붙잡혀야 하는 곳이라
            한 번씩 통 튀게 했습니다(index.css의 ps-pop). */}
        <motion.div variants={rise} className="relative mt-4">
          {/* 튈 때 같이 번지는 금색 테 — 판 뒤에 깔립니다 */}
          <span className="ps-pop-ring pointer-events-none absolute inset-0 rounded-2xl bg-[#feca36]" />

          <div className="ps-pop relative rounded-2xl bg-[#feca36] px-5 py-4 text-center shadow-[0_6px_0_#d9a316,0_14px_24px_rgba(24,44,96,0.42)]">
            <span className="text-[clamp(19px,5.4vw,23px)] leading-[1.35] font-bold text-[#1c2e63]">
              {lines(booth.zone).map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
