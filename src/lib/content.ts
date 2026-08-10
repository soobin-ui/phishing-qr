import formJson from '../content/form.json'
import uiJson from '../content/ui.json'
import revealJson from '../content/reveal.json'
import type { FieldDef } from '../types'

export const form = formJson
export const fields = formJson.fields as unknown as FieldDef[]
export const ui = uiJson
export const reveal = revealJson

/**
 * 응모 폼 [자세히] 안에 있던 그 안내문.
 * 빨간 화면 5단계에서 "그대로 다시 표시"해야 하므로 같은 출처를 씁니다.
 * (따로 옮겨 적으면 한쪽만 고쳐져서 거짓말이 됩니다.)
 */
export const consentNotice = formJson.consent.notice
