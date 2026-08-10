import { fields, reveal } from './content'
import { formatDate8 } from './format'
import type { Answers, RevealCard } from '../types'

const shortLabels = reveal.shortLabels as Record<string, string>

/**
 * 참가자가 실제로 적은 항목만 카드로 만듭니다.
 * 안 적은 항목은 카드에 없습니다 — 적지도 않은 걸 되돌려주면 그 순간 연출이 깨집니다.
 * 순서는 응모 폼에 나왔던 순서 그대로입니다.
 */
export function buildCards(answers: Answers): RevealCard[] {
  const cards: RevealCard[] = []

  for (const field of fields) {
    const raw = (answers[field.id] ?? '').trim()
    if (raw === '') continue

    cards.push({
      id: field.id,
      label: shortLabels[field.id] ?? field.label,
      value: field.format === 'date8' ? formatDate8(raw) : raw,
    })
  }

  return cards
}

/**
 * 진동은 어디까지나 보조입니다. 지원하지 않는 기기(아이폰 전부)에서는 조용히 무시됩니다.
 * 배열을 넘기면 [진동, 쉬고, 진동, …] 패턴이 되고, 0을 넘기면 진행 중인 진동이 멈춥니다.
 */
export function buzz(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(pattern)
  }
}
