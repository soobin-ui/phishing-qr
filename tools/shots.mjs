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

// [0] 시작 화면 — 마스코트가 튀어나오는 중 / 다 나온 뒤
await wait(500)
await shot('intro-pop')
await wait(1200)
await shot('intro')

await page.evaluate(() => {
  ;[...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '응모하기').click()
})
await wait(700)

// [1] 응모 폼
await shot('form-top')
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await wait(400)
await shot('form-bottom')

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
  set('interest', '취업·이직')
  set('region', '경기')
  set('email', 'gildong@example.com')
})
await wait(300)
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await wait(200)
await shot('form-filled')

await page.evaluate(() => {
  ;[...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '응모하기').click()
})

// [2] 전송 중 — 흔한 응모 폼처럼 보이는 1.8초
await wait(700)
await shot('sending')

// [3] 빨간 화면 — ! → [경고] → 개인정보 유출 → 적은 값이 한 줄씩 주르륵
await wait(1200)
await shot('leak-tri')
await wait(3200)
await shot('leak-title')

// 적은 값까지 다 나오고 [다음]이 켜질 때까지 기다립니다(항목 길이에 따라 시간이 달라집니다).
await page.waitForFunction(
    () => {
      const b = document.querySelector('[data-role="alarm-next"]')
      return !!b && getComputedStyle(b).pointerEvents !== 'none'
    },
    { timeout: 30000 },
  )
await wait(200)
await shot('leak-done')

// [다음] 을 눌러 큰 글씨 화면으로 (자동으로 넘어가지 않습니다 — 눌러야 넘어갑니다)
await page.evaluate(() => document.querySelector('[data-role="alarm-next"]').click())

// 큰 글씨 — 뜰 때까지 기다립니다.
await page.waitForFunction(
    () => {
      const b = document.querySelector('[data-role="punch-next"]')
      return !!b && getComputedStyle(b).pointerEvents !== 'none'
    },
    { timeout: 25000 },
  )
await wait(900)
await shot('punch')

// [다음] 을 눌러서 넘어가는지 확인 (자동으로도 넘어가지만 버튼이 먼저 동작해야 합니다)
await page.evaluate(() => {
  const btn = document.querySelector('[data-role="punch-next"]')
  if (!btn) throw new Error('큰 글씨 화면에 [다음] 버튼이 없습니다')
  btn.click()
})

// 질문 화면 — 경광봉이 치는 중이라 프레임을 여러 장
await wait(1200)
await shot('question-a')
await wait(200)
await shot('question-b')
await wait(200)
await shot('question-c')

// [4] 마지막 한 마디 — 이제 아래로 미는 게 아니라 [다음] 버튼입니다
await page.evaluate(() => document.querySelector('[data-role="question-next"]').click())
await wait(900)
await shot('after-a')
await wait(900)
await shot('after')

// [5] 부스 유도
await page.evaluate(() => document.querySelector('[data-role="after-next"]').click())
await wait(800)
await shot('booth')

await browser.close()
console.log('완료 →', OUT)
