/**
 * 화면을 실제로 찍어봅니다 (개발용).
 *
 *   npm run shots                       # 로컬 빌드본(http://localhost:8898)
 *   npm run shots -- https://주소/      # 배포본
 *
 * 결과는 tools/shots/ 에 PNG 로 떨어집니다.
 * PC에 설치된 크롬을 그대로 쓰므로 따로 받을 게 없습니다.
 */
import { mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const URL = process.argv[2] || 'http://localhost:8898/'
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'shots')

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'],
})

const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })

let n = 0
const shot = async (name) => {
  n += 1
  const file = join(OUT, `${String(n).padStart(2, '0')}-${name}.png`)
  await page.screenshot({ path: file })
  console.log('  ', file.split(/[\\/]/).pop())
}

console.log('열기:', URL)
await page.goto(URL + (URL.includes('?') ? '&' : '?') + 'shot=' + Date.now(), {
  waitUntil: 'networkidle0',
})

// [1] 응모 폼
await shot('form-top')
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await wait(400)
await shot('form-bottom')

// [자세히] 펼친 상태
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '자세히')
  if (b) b.click()
})
await wait(300)
await shot('form-notice')

// 값을 채우고 제출
await page.evaluate(() => {
  const set = (id, v) => {
    const el = document.getElementById(id)
    const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }
  set('name', '홍길동')
  set('phone', '01012345678')
  set('birth', '19960314')
  set('org', '한빛대학교')
  set('interest', '취업·이직')
  set('region', '경기')
  set('email', 'gildong@example.com')
  document.querySelectorAll('input[type=checkbox]')[0].click()
})
await wait(300)
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await wait(200)
await shot('form-filled')

await page.evaluate(() => {
  ;[...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '응모하기').click()
})

// [2] 접수 완료
await wait(400)
await shot('complete-spinner')
await wait(1200)
await shot('complete-done')

// [3] 경광등 + 전송 로그 — 애니메이션이라 여러 프레임
await wait(1500)
await shot('alarm-a')
await wait(700)
await shot('alarm-b')

// 큰 글씨
await wait(1600)
await shot('punch')

// 질문 화면 — 경광등이 도는 중이라 프레임을 여러 장
await wait(1900)
await shot('question-a')
await wait(200)
await shot('question-b')
await wait(200)
await shot('question-c')

// 아래로 밀면 나오는 마지막 한 마디
await page.evaluate(() => {
  const s = document.querySelector('.snap-y')
  s.scrollTo({ top: s.clientHeight, behavior: 'auto' })
})
await wait(700)
await shot('after')

// [4] 부스 유도
await page.evaluate(() => {
  const s = document.querySelector('.snap-y')
  s.children[1].querySelector('button').click()
})
await wait(800)
await shot('booth')

await browser.close()
console.log('완료 →', OUT)
