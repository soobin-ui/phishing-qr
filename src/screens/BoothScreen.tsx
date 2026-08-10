import { ui } from '../lib/content'

/**
 * [4] 부스 유도.
 * 경광등이 꺼지고 조용해집니다. 여기서 할 일은 딱 두 가지 —
 * 태블릿 체험존으로 보내고, 경품 받아가라고 알려주는 것.
 */
export default function BoothScreen() {
  const booth = ui.booth

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0a0b12]">
      <div className="relative flex h-full flex-col items-center justify-center px-6">
        <div className="w-full max-w-[400px]">
          <p className="text-[18px] text-white/55">{booth.lead}</p>

          <div className="mt-2">
            {booth.lines.map((line, i) => (
              <p
                key={i}
                className="text-[32px] leading-[1.24] font-black tracking-tight text-white"
              >
                {line}
              </p>
            ))}
          </div>

          {/* 어디로 가라는 건지 — 화살표와 함께 */}
          <div className="mt-9 flex items-center gap-3 border border-white/25 px-4 py-4">
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

        {/* 경품 안내는 화면 아래에 밝게 — 이게 관람객이 마지막으로 챙겨야 할 정보입니다 */}
        <div
          className="absolute inset-x-0 bottom-0 bg-white px-6 pt-5 pb-5 text-center"
          style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        >
          <p className="text-[17px] font-bold text-[#0a0b12]">{booth.goods}</p>
        </div>
      </div>

      <div className="qr-vignette" />
      <div className="qr-grain" />
    </div>
  )
}
