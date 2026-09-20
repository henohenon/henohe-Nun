import { chromium } from 'playwright'

console.log('[test] step 1: launching browser...')
const browser = await chromium.launch({ timeout: 15000 })
console.log('[test] step 2: browser launched, version:', browser.version())

console.log('[test] step 3: creating page...')
const page = await browser.newPage()
console.log('[test] step 4: page created')

console.log('[test] step 5: goto about:blank...')
await page.goto('about:blank')
console.log('[test] step 6: page loaded')

await browser.close()
console.log('[test] step 7: done — playwright works')
