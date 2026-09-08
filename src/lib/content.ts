import formJson from '../content/form.json'
import uiJson from '../content/ui.json'
import revealJson from '../content/reveal.json'
import type { FieldDef } from '../types'

export const form = formJson
export const fields = formJson.fields as unknown as FieldDef[]
export const ui = uiJson
export const reveal = revealJson
