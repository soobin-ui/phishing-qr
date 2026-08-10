/** 입력 항목의 종류 — form.json 의 "type" 값과 1:1로 대응합니다. */
export type FieldType = 'text' | 'phone' | 'digits' | 'email' | 'select'

export interface FieldDef {
  id: string
  label: string
  type: FieldType
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
