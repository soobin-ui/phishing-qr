import type { FieldDef } from '../types'

/**
 * 응모 폼 입력 검사.
 *
 * ★ 값을 서버에 보내려는 게 아닙니다. 그런데도 형식을 따지는 이유 —
 *   "010"으로 시작하는 진짜 같은 번호, 실제로 있는 생년월일을 스스로 적어야
 *   빨간 화면에서 되돌려줄 때 "내가 진짜 내 걸 적었구나"가 됩니다.
 *   아무 글자나 눌러 넘긴 사람에게는 이 체험이 성립하지 않습니다.
 *
 * ★ 그래도 사람을 가두면 안 됩니다. 통과 못 할 만한 규칙은 넣지 마세요
 *   (예: 이름 글자 수 상한, 이메일 도메인 화이트리스트).
 *
 * 되돌려주는 값: 문제가 있으면 안내 문구, 없으면 null.
 */
export function checkField(def: FieldDef, raw: string): string | null {
  const value = raw.trim()

  if (value === '') {
    return def.required ? (def.emptyMessage ?? '입력해 주세요.') : null
  }

  const bad = def.invalidMessage ?? '입력하신 내용을 확인해 주세요.'

  switch (def.rule) {
    case 'personName':
      // 한글·영문·공백만. 숫자와 기호는 막습니다.
      // 자음/모음만 친 것(ㅎㅎ, ㅋㅋ)도 이름이 아닙니다.
      if (!/^[가-힣a-zA-Z\s]+$/.test(value)) return bad
      if (value.replace(/\s/g, '').length < 2) return bad
      return null

    case 'phone': {
      // 010 으로 시작하는 11자리. (하이픈은 화면에서 자동으로 붙습니다)
      const digits = value.replace(/\D/g, '')
      if (!/^010\d{8}$/.test(digits)) return bad
      return null
    }

    case 'birth8': {
      // 8자리 + 실제로 있는 날짜여야 합니다. 19961332 같은 건 통과 못 합니다.
      if (!/^\d{8}$/.test(value)) return bad
      const y = Number(value.slice(0, 4))
      const m = Number(value.slice(4, 6))
      const d = Number(value.slice(6, 8))
      const now = new Date()
      if (y < 1900 || y > now.getFullYear()) return bad
      if (m < 1 || m > 12) return bad
      // 그 달에 실제로 있는 날짜인지 (2월 30일 같은 것)
      const last = new Date(y, m, 0).getDate()
      if (d < 1 || d > last) return bad
      // 아직 오지 않은 날
      if (new Date(y, m - 1, d).getTime() > now.getTime()) return bad
      return null
    }

    case 'email':
      // 적었으면 형식은 맞아야 합니다. 도메인까지 따지지는 않습니다.
      if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value)) return bad
      return null

    default:
      return null
  }
}

/** 문제가 있는 항목만 [항목, 안내문구] 로 추려 돌려줍니다. 폼에 나온 순서 그대로. */
export function checkAll(
  fields: FieldDef[],
  answers: Record<string, string>,
): { def: FieldDef; message: string }[] {
  const found: { def: FieldDef; message: string }[] = []
  for (const def of fields) {
    const message = checkField(def, answers[def.id] ?? '')
    if (message) found.push({ def, message })
  }
  return found
}
