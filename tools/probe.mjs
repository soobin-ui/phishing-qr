/** 스크롤 상태에서 각 요소의 투명도·위치를 찍어보는 진단용 스크립트 */
import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const URL = process.argv[2] || 'http://localhost:8898/'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'],
})
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
await page.goto(URL + '?probe=' + Date.now(), { waitUntil: 'networkidle0' })

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
  document.querySelectorAll('input[type=checkbox]')[0].click()
})
await wait(300)
await page.evaluate(() => {
  ;[...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '응모하기').click()
})
await wait(9000)

const report = async (label, ratio) => {
  const out = await page.evaluate((r) => {
    const s = document.querySelector('.snap-y')
    if (!s) return { err: 'no scroller' }
    if (r !== null) s.scrollTop = s.clientHeight * r
    return new Promise((res) =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const secs = [...s.children]
          const pick = (el) => {
            const cs = getComputedStyle(el)
            const b = el.getBoundingClientRect()
            return `opacity=${(+cs.opacity).toFixed(2)} y=${Math.round(b.top)} transform=${cs.transform.slice(0, 34)}`
          }
          res({
            scrollTop: s.scrollTop,
            clientH: s.clientHeight,
            scrollH: s.scrollHeight,
            진행률: (s.scrollTop / (s.scrollHeight - s.clientHeight)).toFixed(2),
            섹션1_경광봉: pick(secs[0].children[0]),
            섹션1_글씨: pick(secs[0].children[1]),
            섹션2_글씨: pick(secs[1].children[0]),
          })
        }),
      ),
    )
  }, ratio)
  console.log('\n[' + label + ']')
  for (const [k, v] of Object.entries(out)) console.log('  ', k, ':', v)
}

await report('맨 위', null)
await report('45% 스크롤', 0.45)
await wait(600)
await report('45% (0.6초 뒤 — 스냅 작동 후)', null)
await report('맨 아래', 1)
await wait(600)
await report('맨 아래 (0.6초 뒤)', null)

await browser.close()
