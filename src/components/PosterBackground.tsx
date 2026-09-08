/**
 * 홍보 포스터(A4·X배너)의 배경을 그대로 옮겨 놓은 배경판.
 *
 * 포스터 원본 이미지를 깔지 않고 CSS/SVG로 다시 그린 이유
 *   - 휴대폰 화면 비율이 제각각이라 이미지를 깔면 위아래가 잘리거나 늘어납니다.
 *   - 배경 이미지 한 장이면 300KB가 넘는데, 여기선 0KB입니다.
 *   - 색은 포스터 원본 픽셀에서 뽑은 값이라 인쇄물과 나란히 놓아도 같은 색입니다.
 *
 * 조각들의 좌표는 포스터 배치를 눈으로 맞춘 값입니다. 숫자를 바꾸면 위치가 바뀝니다.
 */

/** 포스터에 쓰인 색종이 색 그대로 */
const CONFETTI = [
  { x: '6%', y: '7%', w: 15, h: 19, rot: -18, c: '#ef4b63' },
  { x: '20%', y: '3%', w: 13, h: 16, rot: 24, c: '#ffd23f' },
  { x: '80%', y: '5%', w: 16, h: 20, rot: -32, c: '#2f7d5f' },
  { x: '92%', y: '12%', w: 12, h: 15, rot: 14, c: '#ffd23f' },
  { x: '3%', y: '22%', w: 13, h: 17, rot: 38, c: '#2f6be0' },
  { x: '90%', y: '28%', w: 15, h: 18, rot: -12, c: '#ef4b63' },
  { x: '12%', y: '36%', w: 11, h: 14, rot: 30, c: '#ffd23f' },
  { x: '86%', y: '44%', w: 13, h: 16, rot: -26, c: '#2f7d5f' },
  { x: '4%', y: '52%', w: 14, h: 17, rot: 10, c: '#7b6cf0' },
  { x: '94%', y: '60%', w: 12, h: 15, rot: 42, c: '#ffd23f' },
  { x: '8%', y: '66%', w: 13, h: 16, rot: -20, c: '#ef4b63' },
  { x: '78%', y: '70%', w: 11, h: 14, rot: 18, c: '#2f6be0' },
]

/** 뒤에서 은은하게 떠 있는 흐릿한 동그라미 */
const BOKEH = [
  { x: '-14%', y: '4%', d: 190, o: 0.5 },
  { x: '70%', y: '-6%', d: 230, o: 0.42 },
  { x: '84%', y: '30%', d: 130, o: 0.5 },
  { x: '-8%', y: '38%', d: 160, o: 0.4 },
  { x: '30%', y: '18%', d: 96, o: 0.35 },
  { x: '58%', y: '48%', d: 120, o: 0.3 },
]

const SPARKS = [
  { x: '16%', y: '13%', s: 20, d: '0s' },
  { x: '87%', y: '19%', s: 15, d: '0.9s' },
  { x: '52%', y: '5%', s: 12, d: '1.7s' },
  { x: '9%', y: '45%', s: 14, d: '2.4s' },
  { x: '92%', y: '52%', s: 17, d: '1.2s' },
]

export default function PosterBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="ps-sky" />

      {BOKEH.map((b, i) => (
        <span
          key={`b${i}`}
          className="ps-bokeh"
          style={{ left: b.x, top: b.y, width: b.d, height: b.d, opacity: b.o }}
        />
      ))}

      {SPARKS.map((s, i) => (
        <svg
          key={`s${i}`}
          className="ps-spark"
          style={{ left: s.x, top: s.y, animationDelay: s.d }}
          width={s.s}
          height={s.s}
          viewBox="0 0 24 24"
        >
          {/* 4각 반짝임 — 가운데가 볼록한 별 */}
          <path
            d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z"
            fill="#ffffff"
          />
        </svg>
      ))}

      {CONFETTI.map((c, i) => (
        <span
          key={`c${i}`}
          className="ps-confetti"
          style={{
            left: c.x,
            top: c.y,
            width: c.w,
            height: c.h,
            background: c.c,
            // rotate 는 애니메이션이 이어받습니다(index.css의 ps-float)
            '--ps-rot': `${c.rot}deg`,
            animationDelay: `${(i % 5) * 0.7}s`,
            opacity: 0.92,
          } as React.CSSProperties}
        />
      ))}

      {/* ── 아래쪽 금색 아크 + 남색 밴드 ────────────────
          포스터 하단을 그대로 옮긴 부분입니다.
          preserveAspectRatio="none" 이라 화면 폭이 달라져도 곡선이 끝까지 붙습니다. */}
      <svg
        className="absolute inset-x-0 bottom-0 h-[210px] w-full"
        viewBox="0 0 430 210"
        preserveAspectRatio="none"
      >
        <path d="M0 78 C118 14 300 6 430 52 L430 210 L0 210 Z" fill="#263b7c" />
        <path
          d="M-6 60 C118 -6 302 -14 436 34"
          fill="none"
          stroke="#feca36"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
