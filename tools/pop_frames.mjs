/**
 * 부스 유도 표지판이 쉬지 않고 튀는지 프레임을 여러 장 찍어 확인합니다 (개발용).
 *
 *   node tools/pop_frames.mjs http://localhost:5176/
 *
 * 한 주기를 잘게 나눠 배율·높이를 찍고, 표지판 부분만 잘라
 * tools/shots/pop-*.png 로 떨어뜨립니다.
 * ★ 정지 화면만 보면 "계속 튀는지"를 알 수 없어서 만든 도구입니다.
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

/** 그 버튼이 실제로 화면에 켜질 때까지 기다렸다가 누릅니다.
 *  ★ 버튼들은 레이어를 겹쳐 두는 구조라 처음부터 DOM 에 있습니다.
 *    waitForSelector 로는 즉시 통과되어 화면을 건너뜁니다. */
const clickWhenVisible = (page, role) =>
  page
    .waitForFunction(
      (r) => {
        const b = document.querySelector(`[data-role="${r}"]`)
        return !!b && getComputedStyle(b).pointerEvents !== 'none'
      },
      { timeout: 30000 },
      role,
    )
    .then(() => page.evaluate((r) => document.querySelector(`[data-role="${r}"]`).click(), role))


const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars'],
})
const page = await browser.newPage()
await page.setViewport({
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
})
await page.goto(URL + '?t=' + Date.now(), { waitUntil: 'networkidle0' })
await wait(1500)

const clickByText = (t) =>
  page.evaluate((t) => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === t)
    if (b) b.click()
  }, t)

// [4] 부스 유도까지 밀고 갑니다
await clickByText('응모하기')
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
await clickByText('응모하기')
// [2] 문구 → [3] 질문 → [4] 마지막 한 마디. 이제 전부 [다음] 버튼입니다.
await clickWhenVisible(page, 'punch-next')
await clickWhenVisible(page, 'question-next')
await clickWhenVisible(page, 'after-next')
await wait(1500)

// 한 주기(1.05초)보다 촘촘하게 — 쉬는 구간이 있으면 여기서 드러납니다
for (let i = 0; i < 12; i += 1) {
  const m = await page.evaluate(() => {
    const el = document.querySelector('.ps-pop')
    const t = getComputedStyle(el).transform.match(/-?[\d.]+/g).map(Number)
    return {
      scaleX: t[0].toFixed(3),
      scaleY: t[3].toFixed(3),
      y: t[5].toFixed(1),
      top: el.getBoundingClientRect().top,
    }
  })
  console.log(`  frame ${String(i).padStart(2)}  가로 ${m.scaleX}  세로 ${m.scaleY}  높이 ${m.y}px`)
  await page.screenshot({
    path: join(OUT, `pop-${String(i).padStart(2, '0')}.png`),
    clip: { x: 0, y: Math.max(0, m.top - 60), width: 390, height: 180 },
  })
  await wait(70)
}

await browser.close()
