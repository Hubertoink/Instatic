import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { JSDOM } from 'jsdom'
import { unzipSync } from 'fflate'
import '@modules/base'
import { buildImportPlan, type FileMap } from '@core/siteImport'
import { DEFAULT_BREAKPOINTS, parseSiteDocument } from '@core/page-tree'
import { renderCmsPages } from './build'
import { configureJugendhausFramework, brandColors } from './framework'
import { generateFrameworkRootCss } from '@core/framework'

const directory = import.meta.dir
const slugs = ['index', 'wochenprogramm', 'veranstaltungen', 'angebote', 'news', 'team', 'impressum', 'datenschutz', 'barrierefreiheit']
const archive = unzipSync(new Uint8Array(await Bun.file(join(directory, 'jugendhaus-vogelstang.zip')).arrayBuffer()))
const decoder = new TextDecoder()
const html = (slug: string) => decoder.decode(archive[`${slug}.html`])

function runSiteScript(dom: JSDOM) {
  dom.window.matchMedia = (media) => ({
    media, matches: true, onchange: null,
    addListener: () => undefined, removeListener: () => undefined,
    addEventListener: () => undefined, removeEventListener: () => undefined,
    dispatchEvent: () => true,
  })
  dom.window.eval(decoder.decode(archive['site.js']))
}

describe('Jugendhaus Vogelstang static template', () => {
  it('contains exactly nine complete German pages and three self-contained assets', () => {
    expect(Object.keys(archive).sort()).toEqual([
      ...slugs.map((slug) => `${slug}.html`), 'style.css', 'site.js', 'assets/stage.svg',
    ].sort())
    for (const slug of slugs) {
      const dom = new JSDOM(html(slug))
      const document = dom.window.document
      expect(document.documentElement.lang).toBe('de')
      expect(document.querySelectorAll('h1')).toHaveLength(1)
      expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBeTruthy()
      expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow')
      if (!['impressum', 'datenschutz', 'barrierefreiheit'].includes(slug)) {
        expect(document.querySelector('a[aria-current="page"]')?.getAttribute('href')).toBe(`${slug}.html`)
      }
      expect(document.querySelector('#kontakt')?.textContent).toContain('Freiberger Ring 6')
      expect(document.querySelector('a[href="tel:+496212938285"]')).not.toBeNull()
      expect(document.querySelector('#main .eyebrow, .section-index, .demo-note, .example-badge') === null).toBe(true)
      expect(document.querySelectorAll('.footer-links a')).toHaveLength(3)
      expect(document.querySelectorAll('.flying-badge')).toHaveLength(6)
      dom.window.close()
    }
  })

  it('resolves every local link, anchor, stylesheet, script and image inside the archive', () => {
    for (const slug of slugs) {
      const dom = new JSDOM(html(slug))
      for (const element of dom.window.document.querySelectorAll('[href], [src]')) {
        const reference = element.getAttribute('href') ?? element.getAttribute('src') ?? ''
        if (/^(https?:|mailto:|tel:)/.test(reference)) continue
        const [path, anchor] = reference.split('#')
        const target = path || `${slug}.html`
        expect(archive[target], `${slug}: ${reference}`).toBeDefined()
        if (anchor) {
          const targetDom = new JSDOM(decoder.decode(archive[target]))
          expect(targetDom.window.document.getElementById(anchor), `${slug}: ${reference}`).not.toBeNull()
          targetDom.window.close()
        }
      }
      dom.window.close()
    }
  })

  it('imports through the actual Instatic pipeline with all pages, CSS, script and illustration', () => {
    const fileMap: FileMap = {
      files: Object.fromEntries(Object.entries(archive).map(([path, bytes]) => [path, { bytes }])),
    }
    const plan = buildImportPlan({
      fileMap,
      currentSite: { ...parseSiteDocument({
        id: 'template-test', name: 'Template Test', breakpoints: DEFAULT_BREAKPOINTS,
        styleRules: {}, files: [], createdAt: 0, updatedAt: 0,
      }), pages: [], visualComponents: [], layouts: [] },
      options: { stylesheetModes: { 'style.css': 'file' } },
    })
    expect(plan.pages.map((page) => page.slug).sort()).toEqual([...slugs].sort())
    expect(plan.stylesheets).toHaveLength(1)
    expect(plan.scripts).toHaveLength(1)
    expect(plan.assets.map((asset) => asset.sourcePath)).toContain('assets/stage.svg')
    expect(plan.warnings).toEqual([])
    for (const page of plan.pages) expect(Object.keys(page.nodeFragment.nodes).length).toBeGreaterThan(40)
  })

  it('filters all nine weekly entries and restores the unfiltered programme', () => {
    const dom = new JSDOM(html('wochenprogramm'), { runScripts: 'outside-only' })
    runSiteScript(dom)
    const document = dom.window.document
    const visibleCount = () => [...document.querySelectorAll<HTMLElement>('[data-audience]')].filter((slot) => !slot.hidden).length
    expect(visibleCount()).toBe(9)
    document.querySelector<HTMLButtonElement>('[data-filter="children"]')!.click()
    expect(visibleCount()).toBe(5)
    expect(document.querySelector('#filter-status')?.textContent).toBe('5 Programmeinträge angezeigt.')
    document.querySelector<HTMLButtonElement>('[data-filter="teens"]')!.click()
    expect(visibleCount()).toBe(4)
    expect(document.querySelector('[data-filter="teens"]')?.getAttribute('aria-pressed')).toBe('true')
    document.querySelector<HTMLButtonElement>('[data-filter="all"]')!.click()
    expect(visibleCount()).toBe(9)
    dom.window.close()
  })

  it('imports genuine content loops, nested weekly fields and three detail outlets', () => {
    const encoder = new TextEncoder()
    const cmsPages = renderCmsPages({ angebote: 'offers-table', veranstaltungen: 'events-table', news: 'news-table' })
    const plan = buildImportPlan({
      fileMap: { files: Object.fromEntries([
        ...Object.entries(archive).map(([path, bytes]) => [path, { bytes }]),
        ...Object.entries(cmsPages).map(([slug, source]) => [`${slug}.html`, { bytes: encoder.encode(source) }]),
      ]) },
      currentSite: { ...parseSiteDocument({
        id: 'cms-template-test', name: 'CMS Template Test', breakpoints: DEFAULT_BREAKPOINTS,
        styleRules: {}, files: [], createdAt: 0, updatedAt: 0,
      }), pages: [], visualComponents: [], layouts: [] },
      options: { stylesheetModes: { 'style.css': 'file' } },
    })
    expect(plan.pages).toHaveLength(12)
    for (const [slug, tableId] of [['angebote', 'offers-table'], ['veranstaltungen', 'events-table'], ['news', 'news-table']] as const) {
      const nodes = Object.values(plan.pages.find((page) => page.slug === slug)!.nodeFragment.nodes)
      expect(nodes.some((node) => node.moduleId === 'base.loop' && node.props.sourceId === 'data.rows'
        && typeof node.props.filters === 'object' && node.props.filters !== null
        && 'tableId' in node.props.filters && node.props.filters.tableId === tableId
        && 'pinnedFirst' in node.props.filters && node.props.filters.pinnedFirst === true)).toBe(true)
      expect(nodes.some((node) => node.moduleId === 'base.image' && node.props.src === '{currentEntry.featuredMedia}')).toBe(true)
    }
    const weekly = Object.values(plan.pages.find((page) => page.slug === 'wochenprogramm')!.nodeFragment.nodes)
    expect(weekly.some((node) => node.moduleId === 'base.loop' && node.props.sourceId === 'entry.field'
      && typeof node.props.filters === 'object' && node.props.filters !== null
      && 'fieldId' in node.props.filters && node.props.filters.fieldId === 'weeklySlots')).toBe(true)
    for (const slug of ['angebot-detail', 'veranstaltung-detail', 'news-detail']) {
      const nodes = Object.values(plan.pages.find((page) => page.slug === slug)!.nodeFragment.nodes)
      expect(nodes.some((node) => node.moduleId === 'base.outlet')).toBe(true)
      const dom = new JSDOM(cmsPages[slug])
      const channels = dom.window.document.querySelector('.contact-channels')!
      expect(channels.querySelectorAll('a')).toHaveLength(3)
      expect(channels.querySelectorAll('.channel-icon[aria-hidden="true"]')).toHaveLength(3)
      expect(channels.querySelector('a[href^="mailto:"]')?.getAttribute('aria-label')).toBeTruthy()
      expect(channels.querySelector('a[href^="tel:"]')?.getAttribute('aria-label')).toBeTruthy()
      expect(channels.querySelector('a[href^="https://www.instagram.com/"]')?.getAttribute('rel')).toContain('noopener')
      expect(dom.window.document.querySelector('main')!.textContent).not.toContain('Frag das Team')
      dom.window.close()
    }
    expect(cmsPages.veranstaltungen).toContain('{currentEntry.eventDate:date(de-DE,long)}')
    expect(cmsPages.veranstaltungen).toContain('{currentEntry.startTime}')
    expect(cmsPages.angebote).toContain('{currentEntry.description}')
  })

  it('seeds native framework tokens without resetting subsequent editor choices', () => {
    const framework = configureJugendhausFramework()
    const css = generateFrameworkRootCss(framework)
    for (const [slug, color] of brandColors) {
      expect(framework.colors.tokens.find((token) => token.slug === slug)?.lightValue).toBe(color)
      expect(css).toContain(`--${slug}:`)
    }
    expect(css).toContain('--jhv-text-s:')
    expect(css).toContain('--jhv-space-section:')
    framework.colors.tokens.find((token) => token.slug === 'jhv-primary')!.lightValue = '#80e0ff'
    const updated = configureJugendhausFramework(framework)
    expect(updated.colors.tokens).toHaveLength(brandColors.length)
    expect(updated.colors.tokens.find((token) => token.slug === 'jhv-primary')?.lightValue).toBe('#80e0ff')
    expect(generateFrameworkRootCss(updated)).not.toBe(css)
    expect(updated.typography?.groups).toHaveLength(1)
    expect(updated.spacing?.groups).toHaveLength(1)
    expect(decoder.decode(archive['style.css'])).toContain('--lime: var(--jhv-primary, #c5ff46)')
  })

  it('pauses and resumes decorative footer motion', () => {
    const dom = new JSDOM(html('index'), { runScripts: 'outside-only' })
    runSiteScript(dom)
    const button = dom.window.document.querySelector<HTMLButtonElement>('.motion-toggle')!
    expect(button.hidden).toBe(false)
    button.click()
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(dom.window.document.querySelector('.contact')!.classList.contains('motion-paused')).toBe(true)
    button.click()
    expect(button.getAttribute('aria-pressed')).toBe('false')
    expect(dom.window.document.querySelector('.contact')!.classList.contains('motion-paused')).toBe(false)
    dom.window.close()
  })

  it('opens the mobile menu, closes on Escape and leaves navigation usable without JavaScript', () => {
    const dom = new JSDOM(html('index'), { runScripts: 'outside-only' })
    const document = dom.window.document
    expect(document.body.classList.contains('js-enabled')).toBe(false)
    runSiteScript(dom)
    const menu = document.querySelector<HTMLButtonElement>('.nav-toggle')!
    menu.click()
    expect(menu.getAttribute('aria-expanded')).toBe('true')
    expect(document.querySelector('.nav')?.classList.contains('is-open')).toBe(true)
    expect(document.querySelector<HTMLElement>('.nav')!.inert).toBe(false)
    document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape' }))
    expect(menu.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(menu)
    expect(document.querySelector<HTMLElement>('.nav')!.inert).toBe(true)
    menu.click()
    document.querySelector('h1')!.click()
    expect(menu.getAttribute('aria-expanded')).toBe('false')
    dom.window.close()
  })
})
