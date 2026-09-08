/**
 * 화면이 기기 안에 다 들어가는지 확인합니다 (개발용).
 *
 *   node tools/fit_check.mjs http://localhost:5176/
 *
 * 응모 폼처럼 원래 스크롤되는 화면은 제외하고,
 * 한 화면에 딱 떨어져야 하는 [0] 시작 화면과 [4] 부스 유도만 봅니다.
 * 결과는 tools/shots/fit-*.png 로도 남습니다.
 */
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const URL = process.argv[2] || 'http://localhost:5176/'
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'shots')
mkdirSync(OUT, { recursive: true })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars'],
})

// 전시장에 오는 휴대폰 중 가장 작은 것부터
const sizes = [
  ['se', 375, 667],
  ['iphone', 390, 844],
  ['tall', 412, 915],
]

/** 부스 유도 화면까지 밀고 갑니다 */
async function toBooth(page) {
  const clickByText = (t) =>
    page.evaluate((t) => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === t)
      if (b) b.click()
      return !!b
    }, t)

  await clickByText('응모하기') // [0] 시작 → [1] 폼
  await wait(500)
  // 이름·휴대폰·생년월일은 필수 — 비우면 팝업에 막힙니다
  await page.evaluate(() => {
    const set = (id, v) => {
      const el = document.getElementById(id)
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }
    set('name', '홍길동')
    set('phone', '01012345678')
    set('birth', '19960314')
  })
  await clickByText('응모하기') // [1] 폼 → [2] 접수 완료 → [3] 빨간 화면

  // 큰 글씨 화면의 [다음] 이 나타날 때까지 기다렸다가 누릅니다(등장 시점이 기기마다 다릅니다)
  await page.waitForSelector('[data-role="punch-next"]', { timeout: 20000 })
  await page.evaluate(() => document.querySelector('[data-role="punch-next"]').click())
  await wait(1400)

  // 질문 화면을 아래로 밀고, 마지막 한 마디의 버튼을 눌러 [4] 부스 유도로
  await page.evaluate(() => {
    const s = document.querySelector('.snap-y')
    s.scrollTo({ top: s.clientHeight, behavior: 'auto' })
  })
  await wait(900)
  await page.evaluate(() => document.querySelector('.snap-y').children[1].querySelector('button').click())
  await wait(1200)
}

for (const [name, w, h] of sizes) {
  for (const screen of ['intro', 'booth']) {
    const page = await browser.newPage()
    await page.setViewport({
      width: w,
      height: h,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    })
    await page.goto(URL + '?t=' + Date.now(), { waitUntil: 'networkidle0' })
    await wait(1600)
    if (screen === 'booth') await toBooth(page)

    const m = await page.evaluate(() => ({
      sh: document.documentElement.scrollHeight,
      ch: document.documentElement.clientHeight,
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }))
    const overflowY = m.sh - m.ch
    const overflowX = m.sw - m.cw
    const ok = overflowY <= 1 && overflowX <= 1
    console.log(
      `  ${ok ? 'OK  ' : 'OVER'} ${screen.padEnd(5)} ${w}x${h}  세로 넘침 ${overflowY}px / 가로 넘침 ${overflowX}px`,
    )
    await page.screenshot({ path: join(OUT, `fit-${screen}-${name}.png`) })
    await page.close()
  }
}

await browser.close()
