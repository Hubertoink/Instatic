import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium, type Browser } from 'playwright'

const local = pathToFileURL(join(import.meta.dir, 'index.html')).href
const homeUrl = process.env.TEMPLATE_BASE_URL ?? local
const labels = ['Start', 'Wochenprogramm', 'Veranstaltungen', 'Angebote', 'News', 'Team', 'Impressum', 'Datenschutz', 'Barrierefreiheit']
let browser: Browser
let links: string[]

beforeAll(async () => {
  browser = await chromium.launch()
  const page = await browser.newPage()
  const response = await page.goto(homeUrl)
  if (response && new URL(homeUrl).protocol !== 'file:') expect(response.status()).toBe(200)
  links = await Promise.all(labels.map(async (label) => {
    const navigation = ['Impressum', 'Datenschutz', 'Barrierefreiheit'].includes(label) ? 'Rechtliche Informationen' : 'Hauptnavigation'
    const href = await page.getByRole('navigation', { name: navigation }).getByRole('link', { name: label, exact: true }).getAttribute('href')
    if (!href) throw new Error(`Missing navigation link: ${label}`)
    return new URL(href, homeUrl).href
  }))
  await page.close()
})

afterAll(async () => {
  await browser?.close()
})

describe('Jugendhaus Vogelstang browser verification', () => {
  for (const width of [1440, 375, 320]) {
    for (const [index, label] of labels.entries()) {
      it(`${label}: renders at ${width}px without overflow, missing assets or runtime errors`, async () => {
        const page = await browser.newPage({ viewport: { width, height: 900 } })
        const errors: string[] = []
        page.on('pageerror', (error) => errors.push(error.message))
        page.on('response', (response) => {
          if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`)
        })
        try {
          const response = await page.goto(links[index])
          if (response && new URL(homeUrl).protocol !== 'file:') expect(response.status()).toBe(200)
          await page.locator('body.js-enabled').waitFor()
          await page.evaluate(async () => {
            const images = [...document.images]
            for (const image of images) image.loading = 'eager'
            await Promise.all(images.map((image) => image.decode()))
          })
          expect(await page.locator('h1').count()).toBe(1)
          expect(await page.locator('#kontakt').count()).toBe(1)
          const layout = await page.evaluate(() => ({
            viewport: innerWidth,
            width: document.documentElement.scrollWidth,
            brokenImages: [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).length,
            background: getComputedStyle(document.body).backgroundColor,
          }))
          expect(layout.width).toBeLessThanOrEqual(layout.viewport)
          expect(layout.brokenImages).toBe(0)
          expect(layout.background).toBe('rgb(243, 243, 235)')
          const footerText = await page.locator('.footer-word').evaluate((element) => {
            const range = document.createRange()
            range.selectNodeContents(element)
            return { textWidth: range.getBoundingClientRect().width, availableWidth: element.clientWidth }
          })
          expect(footerText.textWidth).toBeLessThanOrEqual(footerText.availableWidth)
          expect(errors).toEqual([])
        } finally {
          await page.close()
        }
      })
    }
  }

  it('keeps the mobile menu and weekly audience filters functional after publication', async () => {
    const page = await browser.newPage({ viewport: { width: 375, height: 900 } })
    try {
      await page.goto(links[1])
      await page.getByRole('button', { name: 'Menü', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Menü', exact: true }).getAttribute('aria-expanded')).resolves.toBe('true')
      await page.keyboard.press('Escape')
      expect(await page.getByRole('button', { name: 'Menü', exact: true }).getAttribute('aria-expanded')).toBe('false')
      await page.getByRole('button', { name: 'Kinder · 6–12 Jahre', exact: true }).click()
      expect(await page.locator('[data-audience]:visible').count()).toBe(5)
      await page.getByRole('button', { name: 'Teens · 12–27 Jahre', exact: true }).click()
      expect(await page.locator('[data-audience]:visible').count()).toBe(4)
      await page.getByRole('button', { name: 'Alle', exact: true }).click()
      expect(await page.locator('[data-audience]:visible').count()).toBe(9)
    } finally {
      await page.close()
    }
  })

  for (const width of [320, 375, 700]) {
    it(`opens an animated right-aligned mobile dropdown without layout shifts at ${width}px`, async () => {
      const page = await browser.newPage({ viewport: { width, height: 900 } })
      try {
        await page.goto(homeUrl)
        const toggle = page.getByRole('button', { name: 'Menü', exact: true })
        const nav = page.locator('#navigation')
        expect(await nav.getAttribute('inert')).toBe('')
        const skip = page.getByRole('link', { name: 'Zum Inhalt', exact: true })
        await skip.focus()
        expect(await skip.evaluate((element) => {
          const box = element.getBoundingClientRect()
          return document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2) === element
        })).toBe(true)
        const mainTop = await page.locator('main').evaluate((element) => element.getBoundingClientRect().top)
        const animated = await nav.evaluate((element) => {
          document.querySelector<HTMLButtonElement>('.nav-toggle')!.click()
          return element.getAnimations().some((animation) => animation.playState === 'running')
        })
        expect(animated).toBe(true)
        await page.waitForFunction(() => getComputedStyle(document.querySelector('#navigation')!).transform === 'none')
        expect(await nav.getAttribute('inert')).toBeNull()
        const panel = await nav.boundingBox()
        const button = await toggle.boundingBox()
        if (!panel || !button) throw new Error('Dropdown or menu button missing')
        expect(panel.x + panel.width).toBeCloseTo(button.x + button.width, 1)
        expect(panel.y).toBeGreaterThanOrEqual(button.y + button.height)
        expect(await page.locator('main').evaluate((element) => element.getBoundingClientRect().top)).toBe(mainTop)
        for (const link of await nav.getByRole('link').all()) {
          expect((await link.boundingBox())?.height).toBeGreaterThanOrEqual(44)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
        await page.mouse.click(5, 200)
        expect(await toggle.getAttribute('aria-expanded')).toBe('false')
        expect(await nav.getAttribute('inert')).toBe('')
        await toggle.focus()
        await page.keyboard.press('Enter')
        await page.keyboard.press('Tab')
        expect(await nav.getByRole('link', { name: 'Start', exact: true }).evaluate((element) => element === document.activeElement)).toBe(true)
        await page.keyboard.press('Escape')
        expect(await toggle.evaluate((element) => element === document.activeElement)).toBe(true)
        await page.keyboard.press('Enter')
        for (let i = 0; i < 8; i++) await page.keyboard.press('Tab')
        expect(await toggle.getAttribute('aria-expanded')).toBe('false')
        await page.setViewportSize({ width: 1000, height: 900 })
        await page.waitForFunction(() => !document.querySelector('#navigation')!.hasAttribute('inert'))
        expect(await nav.getAttribute('inert')).toBeNull()
        expect(await nav.getByRole('link', { name: 'Start', exact: true }).isVisible()).toBe(true)
        expect(await toggle.isVisible()).toBe(false)
      } finally {
        await page.close()
      }
    })
  }

  it('animates original footer badges with a working keyboard-accessible pause button', async () => {
    const page = await browser.newPage()
    try {
      await page.goto(homeUrl)
      const badge = page.locator('.flying-badge').first()
      expect(await page.locator('.flying-badge').count()).toBe(6)
      expect(await page.locator('.footer-badges').getAttribute('aria-hidden')).toBe('true')
      expect(await badge.evaluate((element) => getComputedStyle(element).animationName)).toBe('badge-flight')
      const toggle = page.getByRole('button', { name: 'Footer-Animation pausieren', exact: true })
      await toggle.focus()
      await page.keyboard.press('Enter')
      expect(await badge.evaluate((element) => getComputedStyle(element).animationPlayState)).toBe('paused')
      await page.keyboard.press('Enter')
      expect(await badge.evaluate((element) => getComputedStyle(element).animationPlayState)).toBe('running')
    } finally {
      await page.close()
    }
  })

  it('respects reduced motion without requiring JavaScript interaction', async () => {
    const page = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 320, height: 900 } })
    try {
      await page.goto(homeUrl)
      expect(await page.locator('.flying-badge').first().evaluate((element) => getComputedStyle(element).animationName)).toBe('none')
      expect(await page.locator('.motion-toggle').isVisible()).toBe(false)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
      await page.getByRole('button', { name: 'Menü', exact: true }).click()
      expect(await page.locator('#navigation').evaluate((element) => getComputedStyle(element).transitionDuration)).toBe('0s')
    } finally {
      await page.close()
    }
  })

  it('keeps footer motion stationary and legal navigation usable without JavaScript', async () => {
    const page = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 320, height: 900 } })
    try {
      await page.goto(homeUrl)
      expect(await page.locator('.flying-badge').first().evaluate((element) => getComputedStyle(element).animationPlayState)).toBe('paused')
      expect(await page.locator('.motion-toggle').isVisible()).toBe(false)
      expect(await page.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('link').count()).toBe(7)
      expect(await page.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('link', { name: 'Team', exact: true }).isVisible()).toBe(true)
      await page.getByRole('navigation', { name: 'Rechtliche Informationen' }).getByRole('link', { name: 'Datenschutz', exact: true }).click()
      expect(await page.locator('h1').textContent()).toBe('Datenschutz.')
    } finally {
      await page.close()
    }
  })

  if (new URL(homeUrl).protocol !== 'file:') {
    for (const width of [1440, 320]) {
      for (const [index, label] of [[3, 'Angebot'], [2, 'Veranstaltung'], [4, 'News']] as const) {
        it(`${label}: exposes three direct contact channels at ${width}px on the detail page`, async () => {
          const page = await browser.newPage({ viewport: { width, height: 900 } })
          try {
            await page.goto(links[index])
            const href = await page.locator('main article a').first().getAttribute('href')
            if (!href) throw new Error(`Missing detail link for ${label}`)
            await page.goto(new URL(href, homeUrl).href)
            const channels = page.getByRole('navigation', { name: 'Kontaktiere das Team' })
            expect(await channels.getByRole('link').count()).toBe(3)
            expect(await channels.getByRole('link', { name: 'Schreib uns eine E-Mail', exact: true }).getAttribute('href')).toBe('mailto:jugendhaus.vogelstang@mannheim.de')
            expect(await channels.getByRole('link', { name: 'Ruf das Jugendhaus an', exact: true }).getAttribute('href')).toBe('tel:+496212938285')
            expect(await channels.getByRole('link', { name: 'Jugendhaus auf Instagram öffnen (neuer Tab)', exact: true }).getAttribute('href')).toBe('https://www.instagram.com/jugendhausvogelstang/')
            for (const channel of await channels.getByRole('link').all()) {
              const size = await channel.boundingBox()
              expect(size?.width).toBeGreaterThanOrEqual(44)
              expect(size?.height).toBeGreaterThanOrEqual(44)
            }
            expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
          } finally {
            await page.close()
          }
        })
      }
    }
  }
})
