/**
 * 휴대폰 번호에 하이픈을 자동으로 넣습니다.
 * 숫자만 남기고 010-1234-5678 형태로 만듭니다.
 * (유효성 검사가 아닙니다 — 아무 숫자나 적어도 통과시킵니다.)
 */
export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

/** 숫자만 남깁니다(생년월일 등). */
export function digitsOnly(raw: string, maxLength: number): string {
  return raw.replace(/\D/g, '').slice(0, maxLength)
}

/** JSON 문구의 줄바꿈(\n)을 실제 줄바꿈으로 렌더링하기 위해 잘라줍니다. */
export function lines(text: string): string[] {
  return text.split('\n')
}

/** "{count}가지를 알려줬습니다." 의 {자리}를 실제 값으로 채웁니다. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in values ? String(values[key]) : `{${key}}`,
  )
}

/** 19960314 → 1996.03.14 (8자리가 아니면 적은 그대로 둡니다) */
export function formatDate8(raw: string): string {
  if (!/^\d{8}$/.test(raw)) return raw
  return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6)}`
}
