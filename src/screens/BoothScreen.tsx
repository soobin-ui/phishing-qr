import { ui } from '../lib/content'
import { lines } from '../lib/format'
import Mascot from '../components/Mascot'

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

      <div className="relative flex h-full flex-col items-center justify-center px-6 pb-14">
        <Mascot size={106} outline={false} />

        <div className="mt-7 w-full max-w-[400px] text-center">
          {booth.lines.map((line, i) => (
            <p
              key={i}
              className="text-[28px] leading-[1.3] font-black tracking-tight text-white"
            >
              {line}
            </p>
          ))}

          <p className="mt-5 text-[17px] leading-relaxed text-white/70">
            {lines(booth.sub).map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </p>

          <div className="mt-8 flex items-center justify-center gap-2.5 border border-white/25 px-4 py-4">
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" className="shrink-0">
              <path
                d="M3 11h15M12 5l6 6-6 6"
                fill="none"
                stroke="#ff5257"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[17px] leading-snug font-bold text-white">{booth.zone}</span>
          </div>
        </div>
      </div>

      {/* 경품 안내는 화면 아래에 밝게 — 관람객이 마지막으로 챙겨야 할 정보입니다 */}
      <div
        className="absolute inset-x-0 bottom-0 bg-white px-6 pt-5 text-center"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <p className="text-[17px] font-bold text-[#0a0b12]">{booth.goods}</p>
      </div>
    </div>
  )
}
