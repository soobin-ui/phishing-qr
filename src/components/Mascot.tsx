/**
 * 한국연구재단(NRF) 안전 마스코트.
 * 실물 인형을 보고 그린 것이라 공식 캐릭터 원본과 미세하게 다를 수 있습니다.
 * 재단에서 공식 이미지 파일을 받으시면 이 컴포넌트를 <img> 로 바꾸면 됩니다.
 *
 * 흰 몸통이 흰 배경에 묻히지 않도록 옅은 윤곽선을 넣었습니다.
 * 어두운 배경에 올릴 때는 outline 을 false 로 주면 윤곽선이 빠집니다.
 */
export default function Mascot({ size = 88, outline = true }: { size?: number; outline?: boolean }) {
  const edge = outline ? '#cbd2d9' : 'none'
  const bodyFill = outline ? '#fdfdfe' : '#ffffff'

  return (
    <svg
      width={size}
      height={(size * 268) / 190}
      viewBox="0 0 190 268"
      fill="none"
      role="img"
      aria-label="안전 마스코트"
    >
      {/* ── 몸 ─────────────────────────── */}
      <ellipse
        cx="41"
        cy="196"
        rx="16"
        ry="27"
        fill={bodyFill}
        stroke={edge}
        strokeWidth="2"
        transform="rotate(-18 41 196)"
      />
      <ellipse
        cx="149"
        cy="196"
        rx="16"
        ry="27"
        fill={bodyFill}
        stroke={edge}
        strokeWidth="2"
        transform="rotate(18 149 196)"
      />
      <ellipse cx="76" cy="250" rx="20" ry="13" fill="#4a90d9" />
      <ellipse cx="114" cy="250" rx="20" ry="13" fill="#4a90d9" />
      <rect
        x="56"
        y="152"
        width="78"
        height="98"
        rx="32"
        fill={bodyFill}
        stroke={edge}
        strokeWidth="2"
      />
      <path d="M95 212 v34" stroke="#e6e8ea" strokeWidth="3" strokeLinecap="round" />
      <text
        x="95"
        y="198"
        textAnchor="middle"
        fontSize="24"
        fontWeight="800"
        fill="#2f74bd"
        fontFamily="system-ui, sans-serif"
      >
        NRF
      </text>

      {/* ── 머리 ───────────────────────── */}
      <circle cx="95" cy="102" r="64" fill="#4a90d9" />
      <ellipse cx="95" cy="106" rx="55" ry="56" fill="#ffffff" />

      <ellipse cx="47" cy="126" rx="13" ry="9" fill="#f6c3b2" />
      <ellipse cx="143" cy="126" rx="13" ry="9" fill="#f6c3b2" />

      {/* 안경 */}
      <path d="M91 104 h8" stroke="#2f74bd" strokeWidth="5" strokeLinecap="round" />
      <circle cx="68" cy="104" r="25" fill="#ffffff" stroke="#2f74bd" strokeWidth="6" />
      <circle cx="122" cy="104" r="25" fill="#ffffff" stroke="#2f74bd" strokeWidth="6" />
      <ellipse cx="70" cy="106" rx="10" ry="12.5" fill="#2f74bd" />
      <ellipse cx="124" cy="106" rx="10" ry="12.5" fill="#2f74bd" />
      <circle cx="74" cy="100" r="3.4" fill="#ffffff" />
      <circle cx="128" cy="100" r="3.4" fill="#ffffff" />

      {/* 입 */}
      <path
        d="M86 136 q9 9 18 0"
        fill="none"
        stroke="#2f74bd"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* ── 안전모 ─────────────────────── */}
      <rect x="73" y="2" width="44" height="44" rx="10" fill="#ffe98f" />
      <path d="M95 12 v18 M86 21 h18" stroke="#2f9e4f" strokeWidth="7" strokeLinecap="round" />
      <path d="M32 66 a63 44 0 0 1 126 0 z" fill="#ffe27a" />
      <ellipse cx="95" cy="66" rx="70" ry="10" fill="#ffd75e" />
      <path
        d="M40 62 a60 40 0 0 1 22 -26"
        stroke="#fff3bd"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
