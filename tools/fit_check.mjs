/**
 * 전 화면 × 전 기기 크기 넘침 검사 (개발용).
 *
 *   node tools/fit_check.mjs http://localhost:5176/
 *   node tools/fit_check.mjs https://soobin-ui.github.io/phishing-qr/
 *   node tools/fit_check.mjs <URL> --dark      # 기기 다크모드 켠 상태로
 *   node tools/fit_check.mjs <URL> --shots     # 넘친 화면을 PNG로 남김
 *
 * 전시장에는 온갖 휴대폰이 옵니다. 가장 작은 것(갤럭시 폴드 커버 280px)부터
 * 가장 큰 것(아이폰 프로맥스 430px)까지 한 번에 훑습니다.
 * "세로 넘침"이 0이 아니면 그 기기에서 스크롤 없이는 다 안 보인다는 뜻입니다.
 */
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const args = process.argv.slice(2)
const URL = args.find((a) => a.startsWith('http')) ?? 'http://localhost:5176/'
const DARK = args.includes('--dark')
const SHOTS = args.includes('--shots')
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'shots')
if (SHOTS) mkdirSync(OUT, { recursive: true })

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

/** 실제로 전시장에 올 만한 휴대폰 폭·높이 (CSS 픽셀, 세로) */
const DEVICES = [
  ['폴드 커버 280', 280, 653],
  ['SE1 320', 320, 568],
  ['안드로이드 360', 360, 640],
  ['SE3 375', 375, 667],
  ['iPhone X 375', 375, 812],
  ['iPhone 14 390', 390, 844],
  ['iPhone 16 393', 393, 852],
  ['픽셀 412', 412, 915],
  ['프로맥스 430', 430, 932],
  // 가로로 눕힌 경우 — 스크롤은 허용하되, 내용이 잘려서 못 보는 일은 없어야 합니다
  ['가로 667', 667, 375],
  ['가로 844', 844, 390],
]

/** 가로로 눕힌 화면은 세로 스크롤을 허용합니다 */
const isLandscape = (w, h) => w > h

/** 그 버튼이 실제로 화면에 켜질 때까지 기다렸다가 누릅니다.
 *  ★ 버튼들은 레이어를 겹쳐 두는 구조라 처음부터 DOM 에 있습니다.
 *    waitForSelector 로는 즉시 통과되어 화면을 건너뜁니다. */
const whenVisible = (page, role) =>
  page.waitForFunction(
    (r) => {
      const b = document.querySelector(`[data-role="${r}"]`)
      return !!b && getComputedStyle(b).pointerEvents !== 'none'
    },
    { timeout: 30000 },
    role,
  )

const click = (page, role) =>
  page.evaluate((r) => document.querySelector(`[data-role="${r}"]`).click(), role)

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars'],
})

console.log(`검사 대상: ${URL}${DARK ? '  (기기 다크모드 켬)' : ''}`)
let bad = 0

for (const [label, w, h] of DEVICES) {
  const page = await browser.newPage()
  if (DARK) await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }])
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await page.goto(URL + '?t=' + Date.now(), { waitUntil: 'networkidle0' })
  await wait(1500)

  const results = []
  const land = isLandscape(w, h)
  const measure = async (name, { scrollOk = false } = {}) => {
    // 빨간 화면은 문서가 아니라 '켜져 있는 레이어' 안쪽이 스크롤됩니다.
    // 그래서 문서 넘침과 레이어 넘침을 둘 다 봅니다.
    // (배경 장식 — 보케·빛줄기·네온 번짐 — 은 원래 화면 밖으로 번지므로 세지 않습니다)
    const m = await page.evaluate(() => {
      const d = document.documentElement
      let layer = 0
      document.querySelectorAll('.overflow-y-auto').forEach((el) => {
        if (getComputedStyle(el).opacity === '0') return // 꺼져 있는 레이어
        layer = Math.max(layer, el.scrollHeight - el.clientHeight)
      })
      return {
        y: Math.max(d.scrollHeight - d.clientHeight, layer),
        x: d.scrollWidth - d.clientWidth,
      }
    })
    const over = (scrollOk || land ? 0 : m.y) + m.x
    if (over > 0) {
      bad += 1
      if (SHOTS) await page.screenshot({ path: join(OUT, `fit-${w}x${h}-${name}.png`) })
    }
    results.push(
      `${name} ${m.y > 0 && !scrollOk && !land ? `세로+${m.y}` : ''}${m.x > 0 ? ` 가로+${m.x}` : ''}`.trim(),
    )
    return over
  }

  const clickByText = (t) =>
    page.evaluate((t) => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === t)
      if (b) b.click()
    }, t)

  // [0] 시작 화면
  await measure('시작')

  // [1] 응모 폼 — 이 화면만 스크롤을 허용합니다(입력칸이 많아 원래 깁니다)
  await clickByText('응모하기')
  await wait(900)
  await measure('폼', { scrollOk: true })

  // 필수 항목을 채워 넘어갑니다
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
  await wait(150)
  await clickByText('응모하기')

  // [2] 유출 기록 — 다 찍힌 뒤가 가장 깁니다
  await page.waitForFunction(() => !document.querySelector('.qr-caret'), { timeout: 30000 })
  await measure('유출기록')

  // [3] 문구
  await whenVisible(page, 'punch-next')
  await wait(2600)
  await measure('문구')
  await click(page, 'punch-next')

  // [4] 질문
  await whenVisible(page, 'question-next')
  await wait(2200)
  await measure('질문')
  await click(page, 'question-next')

  // [5] 마지막 한 마디
  await whenVisible(page, 'after-next')
  await wait(2000)
  await measure('마지막')
  await click(page, 'after-next')

  // [6] 부스 유도
  await wait(900)
  await measure('부스')

  const dirty = results.filter((r) => r.includes('+'))
  console.log(
    `  ${dirty.length === 0 ? 'OK  ' : '넘침 '} ${label.padEnd(14)} ${w}x${h}  ` +
      (dirty.length === 0 ? '전 화면 이상 없음' : dirty.join(' / ')),
  )
  await page.close()
}

await browser.close()
console.log(bad === 0 ? '\n전부 통과' : `\n${bad}건 넘침`)
process.exitCode = bad === 0 ? 0 : 1
