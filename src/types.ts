/** 입력 항목의 종류 — form.json 의 "type" 값과 1:1로 대응합니다. */
export type FieldType = 'text' | 'phone' | 'digits' | 'email' | 'select'

/**
 * 입력 검사 규칙 — form.json 의 "rule" 값과 1:1로 대응합니다.
 *   personName 한글·영문 2자 이상 / phone 010+11자리 / birth8 실제로 있는 날짜 8자리 / email 형식
 * 규칙을 안 주면 비었는지만 봅니다(required 인 경우).
 */
export type FieldRule = 'personName' | 'phone' | 'birth8' | 'email'

export interface FieldDef {
  id: string
  label: string
  type: FieldType
  /** true 면 라벨에 빨간 * 가 붙고, 비워 두면 제출할 때 팝업이 뜹니다. */
  required?: boolean
  /** 형식 검사 규칙 (src/lib/validate.ts) */
  rule?: FieldRule
  /** 비웠을 때 보여줄 문구 */
  emptyMessage?: string
  /** 형식이 틀렸을 때 보여줄 문구 */
  invalidMessage?: string
  placeholder?: string
  maxLength?: number
  options?: string[]
  /** 빨간 화면에서 값을 다르게 보여줄 때 (date8: 19960314 → 1996.03.14) */
  format?: 'date8'
}

/** 빨간 화면에서 되돌려주는 카드 한 장. */
export interface RevealCard {
  id: string
  label: string
  value: string
}

/**
 * 참가자가 적은 값.
 * 이 객체는 React 상태(메모리)에만 존재합니다.
 * 저장·전송하지 않으며 페이지를 닫으면 사라집니다.
 */
export type Answers = Record<string, string>
