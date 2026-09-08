/**
 * 시작 화면만 여러 기기 크기로 찍어봅니다 (개발용).
 *
 *   node tools/intro_shot.mjs http://localhost:5176/
 *
 * 결과는 tools/shots/ 에 떨어집니다. PC에 설치된 크롬을 그대로 씁니다.
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

// 전시장에 오는 휴대폰 중 가장 작은 것(SE)부터 가장 긴 것까지
const sizes = [
  ['se', 375, 667],
  ['iphone', 390, 844],
  ['tall', 412, 915],
]

for (const [name, w, h] of sizes) {
  const page = await browser.newPage()
  await page.setViewport({
    width: w,
    height: h,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  await page.goto(URL + '?t=' + Date.now(), { waitUntil: 'networkidle0' })
  await wait(2200)
  await page.screenshot({ path: join(OUT, `intro-${name}.png`) })
  console.log('  intro-' + name + '.png', w + 'x' + h)
  await page.close()
}

await browser.close()
