import { motion } from 'framer-motion'
import { form } from '../lib/content'
import { unlockAudio } from '../lib/alarm'
import { lines } from '../lib/format'
import PosterBackground from '../components/PosterBackground'
import mascotLeft from '../assets/mascot-left.webp'
import mascotRight from '../assets/mascot-right.webp'

interface Props {
  onStart: () => void
}

/**
 * [0] 시작 화면. QR을 찍으면 가장 먼저 뜹니다.
 *
 * ★ 이 화면은 홍보 포스터(A4·X배너)와 같은 얼굴이어야 합니다.
 *   부스 앞에 걸린 포스터를 보고 QR을 찍은 사람이라
 *   같은 하늘색·같은 캐릭터·같은 서체가 떠야 "그 부스 페이지"로 받아들입니다.
 *   두 캐릭터는 인쇄용 원본(A4 가로 300dpi)에서 오려낸 실제 이미지입니다.
 *
 * ★ 대신 다음 화면(응모 폼)은 지금처럼 평범해야 합니다.
 *   여기서 신뢰를 얻고, 폼에서는 아무 의심 없이 적게 하는 순서입니다.
 */
export default function IntroScreen({ onStart }: Props) {
  const handleStart = () => {
    // 관람객이 화면을 처음 건드리는 순간입니다.
    // 브라우저는 이때 소리를 열어줍니다 — 빨간 화면 사이렌을 쓰려면 여기서 해야 합니다.
    unlockAudio()
    onStart()
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#8fc4fb]">
      <PosterBackground />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pt-9 pb-7">
        {/* ── 행사명 배지 ─────────────────────────── */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <span className="rounded-full bg-[#263b7c] px-4 py-1.5 text-[13px] font-bold tracking-tight text-white shadow-[0_4px_10px_rgba(24,44,96,0.3)]">
            {form.intro.badge}
          </span>
        </motion.div>

        {/* ── 제목 ────────────────────────────────
            포스터와 같이 금색 + 흰색, 남색 테두리에 두꺼운 그림자를 넣었습니다. */}
        <motion.h1
          className="mt-4 text-center leading-[1.12] font-bold [filter:drop-shadow(0_4px_0_rgba(28,46,99,0.35))_drop-shadow(0_10px_16px_rgba(24,44,96,0.3))]"
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.1 }}
        >
          <span
            className="ps-outline block text-[clamp(38px,11.2vw,50px)] text-[#feca36]"
            style={{ WebkitTextStrokeWidth: '7px' }}
          >
            {form.intro.titleAccent}
          </span>
          <span
            className="ps-outline block text-[clamp(38px,11.2vw,50px)] text-white"
            style={{ WebkitTextStrokeWidth: '7px' }}
          >
            {form.intro.titleMain}
          </span>
        </motion.h1>

        {/* 화면이 긴 기기에서 남는 세로 공간을 제목 아래와 리본 아래로 나눠 갖습니다.
            (한쪽에만 몰아주면 리본과 캐릭터 사이가 텅 빈 구멍처럼 보입니다.) */}
        <div className="flex-[0.9]" />

        {/* ── 안내 문구 리본 ──────────────────────
            포스터의 남색 띠와 같은 모양입니다(양 끝이 안쪽으로 깎인 리본). */}
        <motion.p
          className="ps-ribbon mx-auto bg-[#263b7c] px-8 py-3.5 text-center text-[16px] leading-relaxed font-medium text-white"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.32 }}
        >
          {lines(form.intro.description).map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </motion.p>

        {/* ── 두 캐릭터 ───────────────────────────
            포스터에서 오려낸 그대로입니다. 남는 세로 공간은 여기가 먹습니다.
            items-end 라 화면이 길든 짧든 항상 남색 밴드 위에 발이 닿습니다. */}
        <div className="ps-mascots relative flex min-h-0 flex-1 items-end justify-center gap-1 pt-4">
          <motion.img
            src={mascotLeft}
            alt=""
            className="ps-mascot-l ps-mascot-shadow self-end"
            initial={{ opacity: 0, x: -34, y: 16, rotate: -6 }}
            animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 210, damping: 17, delay: 0.5 }}
          />
          <motion.img
            src={mascotRight}
            alt=""
            className="ps-mascot-r ps-mascot-shadow mb-[1.5%] self-end"
            initial={{ opacity: 0, x: 34, y: 16, rotate: 6 }}
            animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 210, damping: 17, delay: 0.62 }}
          />
        </div>

        {/* ── 응모하기 ────────────────────────────
            금색 버튼 하나. 이 화면에서 누를 수 있는 것은 이것뿐입니다. */}
        <motion.div
          className="mt-4"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.8 }}
        >
          <button
            onClick={handleStart}
            className="ps-cta ps-breathe h-[58px] w-full rounded-2xl bg-[#feca36] text-[19px] font-bold text-[#1c2e63]"
          >
            {form.intro.button}
          </button>
        </motion.div>

        {/* ── 각주 ────────────────────────────────
            ★ 이 한 줄은 지우지 마세요. 포스터에도 같은 문장이 박혀 있고,
              "입력값을 저장하지 않는다"는 이 기획의 절대 원칙을 사전에 고지하는 자리입니다. */}
        <motion.p
          className="mt-3.5 text-center text-[12px] leading-relaxed text-white/85"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          {form.intro.footnote}
        </motion.p>
      </div>
    </div>
  )
}
