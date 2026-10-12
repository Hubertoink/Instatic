import { join } from 'node:path'
import { nanoid } from 'nanoid'
import { Window } from 'happy-dom'
import '@modules/base'
import { apiRequest, apiTextRequest, type FetchLike } from '@core/http'
import { Type, type TSchema, type Static } from '@sinclair/typebox'
import { DataRowSchema, DataTableSchema, type DataField } from '@core/data/schemas'
import { buildPostTypeDefaultFields } from '@core/data/fields'
import { pageFromRow } from '../../../src/core/data/pageFromRow'
import { createNode, SiteShellSchema, reindexNodeParents, type Page, type SiteDocument } from '@core/page-tree'
import { buildImportPlan, rewriteInternalLinks, type FileMap } from '@core/siteImport'
import {
  createStyleRuleOrderAllocator,
  indexStyleRulesByName,
  linkImportedClassNames,
} from '../../../src/admin/pages/site/store/slices/site/importLinking'
import { CmsMediaAssetEnvelopeSchema, CmsMediaListResponseSchema } from '../../../src/core/persistence/responseSchemas'
import { events, news, offers, renderCmsPages, iconFontPath, templateAssets } from './build'
import { configureJugendhausFramework } from './framework'

const baseUrl = new URL(process.env.CMS_URL ?? 'http://localhost:3015')
if (!['localhost', '127.0.0.1'].includes(baseUrl.hostname)) throw new Error('This installer only supports a local CMS.')
const password = process.env.CMS_PASSWORD
if (!password) throw new Error('Set CMS_PASSWORD for the local administrator. No password is stored in this script.')
const directory = import.meta.dir
let cookie = ''
const fetchImpl: FetchLike = async (input, init) => {
  const headers = new Headers(init?.headers)
  headers.set('Origin', baseUrl.origin)
  if (cookie) headers.set('Cookie', cookie)
  const response = await fetch(input, { ...init, headers })
  const sessionCookie = response.headers.getSetCookie().find((value) => value.startsWith('instatic_admin_session='))
  if (sessionCookie) cookie = sessionCookie.split(';')[0]
  return response
}
function request<S extends TSchema>(path: string, schema: S, method = 'GET', body?: unknown): Promise<Static<S>> {
  return apiRequest(new URL(`/admin/api/cms${path}`, baseUrl).href, { schema, method, body, fetchImpl })
}
const okSchema = Type.Object({ ok: Type.Boolean() })
await request('/login', okSchema, 'POST', { email: process.env.CMS_EMAIL ?? 'admin@vogelstang.local', password })
await request('/auth/step-up', Type.Object({ ok: Type.Optional(Type.Boolean()) }), 'POST', { password })

const text = (id: string, label: string, required = true): Extract<DataField, { type: 'text' }> => ({ id, label, type: 'text', required })
const description: DataField = { id: 'description', label: 'Beschreibung', type: 'longText', required: true }
const weeklyField: DataField = {
  id: 'weeklySlots', label: 'Wöchentliche Angebotszeiten', type: 'repeater', required: true, itemLabelFieldId: 'weekday',
  fields: [
    { id: 'weekday', label: 'Wochentag', type: 'select', required: true, options: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'].map((day) => ({ id: day, label: day, value: day })) },
    text('startTime', 'Beginn (HH:MM)'),
    text('endTime', 'Ende (HH:MM)'),
    { id: 'audience', label: 'Altersbereich', type: 'select', required: true, options: [{ id: 'children', label: 'Kinder', value: 'children' }, { id: 'teens', label: 'Teens & junge Erwachsene', value: 'teens' }] },
    text('ageGroup', 'Altersgruppe (z. B. 6–12 Jahre)'),
  ],
}
const specifications = [
  { slug: 'angebote', name: 'Angebote', singularLabel: 'Angebot', routeBase: '/angebot', fields: [description, text('category', 'Bereich'), weeklyField] },
  { slug: 'veranstaltungen', name: 'Veranstaltungen', singularLabel: 'Veranstaltung', routeBase: '/veranstaltung', fields: [description, { id: 'eventDate', label: 'Veranstaltungsdatum', type: 'date', required: true } satisfies DataField, text('startTime', 'Beginn (HH:MM)'), text('endTime', 'Ende (HH:MM)'), text('location', 'Veranstaltungsort')] },
  { slug: 'news', name: 'News', singularLabel: 'Newsbeitrag', routeBase: '/neuigkeit', fields: [description, text('category', 'Rubrik')] },
]
const { tables: existingTables } = await request('/data/tables', Type.Object({ tables: Type.Array(DataTableSchema) }))
const tables = new Map<string, Static<typeof DataTableSchema>>()
for (const specification of specifications) {
  const fields = buildPostTypeDefaultFields().map((field) => field.id === 'featuredMedia' ? { ...field, required: true } : field)
  const existing = existingTables.find((table) => table.slug === specification.slug)
  const body = { ...specification, kind: 'postType', pluralLabel: specification.name, primaryFieldId: 'title', fields: [...fields, ...specification.fields] }
  if (existing && existing.kind !== 'postType') throw new Error(`Existing ${specification.slug} is not a post type.`)
  const { table } = existing
    ? await request(`/data/tables/${existing.id}`, Type.Object({ table: DataTableSchema }), 'PATCH', { fields: body.fields, routeBase: specification.routeBase })
    : await request('/data/tables', Type.Object({ table: DataTableSchema }), 'POST', body)
  tables.set(specification.slug, table)
  for (const expected of specification.fields) {
    if (!table.fields.some((field) => field.id === expected.id)) throw new Error(`CMS rejected field ${table.slug}.${expected.id}`)
  }
  console.info(`Content type ready: ${table.name}`)
}

const { assets = [] } = await request('/media', CmsMediaListResponseSchema)
async function upload(filename: string, source: string | ArrayBuffer, type = 'image/svg+xml') {
  const existing = assets.find((asset) => asset.filename === filename)
  if (existing) return existing
  const form = new FormData()
  form.set('file', new File([source], filename, { type }))
  const { asset } = await request('/media', CmsMediaAssetEnvelopeSchema, 'POST', form)
  assets.push(asset)
  return asset
}
const stage = await upload('stage.svg', await Bun.file(join(directory, 'assets', 'stage.svg')).text())
const iconFont = await upload('tabler-contact-3.49.0.woff2', await Bun.file(join(directory, iconFontPath)).arrayBuffer(), 'font/woff2')
const poster = async (index: number) => {
  const offer = offers[index]
  const lines = offer.word.split('<br>')
  const colors: Record<string, string> = { lime: '#c5ff46', pink: '#ff3970', paper: '#f3f3eb' }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><path fill="${colors[offer.color]}" d="M0 0h800v600H0z"/><g fill="none" stroke="#171916" stroke-width="3"><ellipse cx="400" cy="300" rx="300" ry="140" transform="rotate(-30 400 300)"/><ellipse cx="400" cy="300" rx="300" ry="140" transform="rotate(40 400 300)"/></g><g fill="#171916" font-family="Arial,Helvetica,sans-serif" font-weight="900" font-size="110" text-anchor="middle" transform="rotate(-7 400 300)">${lines.map((line, i) => `<text x="400" y="${280 + i * 110}">${line}</text>`).join('')}</g></svg>`
  return upload(`angebot-${index + 1}.svg`, svg)
}
const offerImages = await Promise.all(offers.map((_, index) => poster(index)))
const schedules = [
  [['Dienstag', '18:00', '20:00', 'teens', '12–27 Jahre']],
  [['Montag', '15:00', '18:00', 'children', '6–12 Jahre'], ['Donnerstag', '18:00', '21:00', 'teens', '12–27 Jahre']],
  [['Mittwoch', '15:00', '18:00', 'children', '6–12 Jahre'], ['Freitag', '17:00', '20:00', 'teens', '12–27 Jahre']],
  [['Dienstag', '15:00', '18:00', 'children', '6–12 Jahre']],
  [['Donnerstag', '15:00', '18:00', 'children', '6–12 Jahre']],
  [['Freitag', '14:00', '17:00', 'children', '6–12 Jahre'], ['Mittwoch', '18:00', '21:00', 'teens', '12–27 Jahre']],
]
const offerSeeds = offers.map((offer, index) => ({
  title: offer.title, slug: `angebot-${index + 1}`, description: offer.text, body: offer.extra,
  category: offer.meta, featuredMedia: offerImages[index].id,
  weeklySlots: schedules[index].map(([weekday, startTime, endTime, audience, ageGroup]) => ({ id: nanoid(), cells: { weekday, startTime, endTime, audience, ageGroup } })),
}))
const eventSeeds = events.map(([title, description], index) => ({
  title, slug: `aktion-${index + 1}`, description, body: description, featuredMedia: index === 0 ? stage.id : offerImages[index === 1 ? 1 : 3].id,
  eventDate: ['2026-11-06', '2026-11-12', '2026-11-20'][index], startTime: index === 0 ? '18:00' : '15:00',
  endTime: index === 0 ? '20:00' : '17:00', location: 'Jugendhaus Vogelstang · Freiberger Ring 6',
}))
const newsSeeds = news.map((item, index) => ({
  title: item.title, slug: item.id, description: item.teaser, category: item.category, body: item.body, featuredMedia: offerImages[index].id,
}))
for (const [slug, seeds] of [['angebote', offerSeeds], ['veranstaltungen', eventSeeds], ['news', newsSeeds]] as const) {
  const table = tables.get(slug)!
  const { rows } = await request(`/data/tables/${table.id}/rows`, Type.Object({ rows: Type.Array(DataRowSchema) }))
  for (const seed of seeds) {
    // A rerun never overwrites an editor's existing content.
    if (rows.some((row) => row.slug === seed.slug)) continue
    const { row } = await request(`/data/tables/${table.id}/rows`, Type.Object({ row: DataRowSchema }), 'POST', { cells: seed })
    await request(`/data/rows/${row.id}/publish`, Type.Object({}, { additionalProperties: true }), 'POST')
  }
  console.info(`Content entries ready: ${slug}`)
}

const { site: shell, seq } = await request('/site', Type.Object({ site: SiteShellSchema, seq: Type.Number() }))
const { rows } = await request('/pages', Type.Object({ rows: Type.Array(DataRowSchema) }))
const oldPages = rows.map(pageFromRow).filter((page): page is Page => page !== null)
const site: SiteDocument = { ...shell, pages: oldPages, visualComponents: [], layouts: [] }
site.settings.framework = configureJugendhausFramework(site.settings.framework)
const ids = { angebote: tables.get('angebote')!.id, veranstaltungen: tables.get('veranstaltungen')!.id, news: tables.get('news')!.id }
const rendered = renderCmsPages(ids)
const dom = new Window({ settings: { disableCSSFileLoading: true, disableJavaScriptFileLoading: true } })
Object.assign(globalThis, { DOMParser: dom.DOMParser, document: dom.document, window: dom, Node: dom.Node, Element: dom.Element })
const fileMap: FileMap = { files: {} }
const encoder = new TextEncoder()
for (const [slug, source] of Object.entries(rendered)) fileMap.files[`${slug}.html`] = { bytes: encoder.encode(source) }
for (const filename of ['style.css', 'site.js']) fileMap.files[filename] = { bytes: new Uint8Array(await Bun.file(join(directory, filename)).arrayBuffer()) }
for (const path of templateAssets) fileMap.files[path] = { bytes: new Uint8Array(await Bun.file(join(directory, path)).arrayBuffer()) }
const plan = buildImportPlan({ fileMap, currentSite: site, options: { stylesheetModes: { 'style.css': 'file' } } })
if (plan.warnings.length) throw new Error(`Import warnings: ${JSON.stringify(plan.warnings)}`)
const pageIds = new Map(plan.pages.map((page) => [page.source, oldPages.find((existing) => existing.slug === page.slug)?.id ?? nanoid()]))
const linkedPages = rewriteInternalLinks(plan.pages, pageIds)
const classNames = indexStyleRulesByName(site.styleRules)
const allocateOrder = createStyleRuleOrderAllocator(site.styleRules)
const changedPages: Page[] = linkedPages.map((page) => {
  const root = createNode('base.body')
  root.children = page.nodeFragment.rootIds
  const nodes = { ...page.nodeFragment.nodes, [root.id]: root }
  for (const node of Object.values(nodes)) {
    node.classIds = linkImportedClassNames(node.classIds, site.styleRules, classNames, allocateOrder)
    if (node.moduleId === 'base.image' && node.props.src === 'assets/stage.svg') node.props.src = stage.publicPath
  }
  reindexNodeParents(nodes)
  const templateSlug = page.slug === 'angebot-detail' ? 'angebote' : page.slug === 'veranstaltung-detail' ? 'veranstaltungen' : page.slug === 'news-detail' ? 'news' : null
  return { id: pageIds.get(page.source)!, title: page.title.split(' | ')[0], slug: page.slug, rootNodeId: root.id, nodes,
    ...(templateSlug ? { template: { enabled: true, target: { kind: 'postTypes', tableSlugs: [templateSlug] }, priority: 10 } } as const : {}),
  }
})
const allPageIds = [...new Set([...oldPages.map((page) => page.id), ...changedPages.map((page) => page.id)])]
for (const [path, type] of [['style.css', 'style'], ['site.js', 'script']] as const) {
  const now = Date.now()
  let file = site.files.find((file) => file.path === path)
  if (!file) {
    file = { id: nanoid(), path, type, createdAt: now, updatedAt: now }
    site.files.push(file)
  }
  file.content = await Bun.file(join(directory, path)).text()
  if (type === 'style') {
    if (!file.content.includes(iconFontPath)) throw new Error('Icon font missing from stylesheet')
    file.content = file.content.replaceAll(iconFontPath, iconFont.publicPath)
  }
  file.updatedAt = now
  const scope = { type: 'pages', pageIds: allPageIds } as const
  if (type === 'style') site.runtime.styles[file.id] = { enabled: true, priority: 100, scope }
  else site.runtime.scripts[file.id] = { enabled: true, runInCanvas: true, format: 'classic', placement: 'body-end', timing: 'dom-ready', priority: 100, scope }
}
const { pages: _pages, visualComponents: _components, layouts: _layouts, ...updatedShell } = site
await request('/site-document', Type.Object({ ok: Type.Boolean(), seq: Type.Number() }), 'PUT', {
  mode: 'incremental', site: updatedShell, changedPages, deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: Object.fromEntries(rows.map((row) => [row.id, row.seq ?? 0])), shellBaseSeq: seq,
})
await request('/publish', Type.Object({}, { additionalProperties: true }), 'POST')
if (Bun.argv.includes('--verify')) {
  for (const [slug, seed] of [['angebote', offerSeeds[0]], ['veranstaltungen', eventSeeds[0]], ['news', newsSeeds[0]]] as const) {
    const table = tables.get(slug)!
    const unique = nanoid()
    const title = `CMS-Verifikation-${unique}`
    const { row } = await request(`/data/tables/${table.id}/rows`, Type.Object({ row: DataRowSchema }), 'POST', { cells: { ...seed, slug: `verifikation-${unique.toLowerCase()}`, title, pinned: true } })
    const readPage = (path: string) => apiTextRequest(new URL(path, baseUrl).href, { fetchImpl })
    try {
      if ((await readPage(`/${slug}`)).includes(title)) throw new Error(`Draft entry leaked into ${slug}`)
      await request(`/data/rows/${row.id}/publish`, Type.Object({}, { additionalProperties: true }), 'POST')
      const listing = await readPage(`/${slug}`)
      if (!listing.includes(title)) throw new Error(`Published entry missing from ${slug} loop`)
      const listingDocument = new dom.DOMParser().parseFromString(listing, 'text/html')
      if (listingDocument.querySelector('main article h3')?.textContent !== title) throw new Error(`Pinned entry not first in ${slug}`)
      const detail = await readPage(`${table.routeBase}/${row.slug}`)
      if (!detail.includes(title) || detail.includes('{currentEntry.')) throw new Error(`Detail template failed for ${slug}`)
      if (slug === 'angebote' && !(await readPage('/wochenprogramm')).includes(title)) throw new Error('Published offer missing from weekly programme')
      const editedTitle = `${title}-Bearbeitet`
      await request(`/data/rows/${row.id}`, Type.Object({ row: DataRowSchema }), 'PATCH', { cells: { ...row.cells, title: editedTitle } })
      if ((await readPage(`/${slug}`)).includes(editedTitle)) throw new Error(`Draft edit leaked into ${slug}`)
      await request(`/data/rows/${row.id}/publish`, Type.Object({}, { additionalProperties: true }), 'POST')
      if (!(await readPage(`/${slug}`)).includes(editedTitle)) throw new Error(`Republished edit missing from ${slug}`)
      await request(`/data/rows/${row.id}/status`, Type.Object({ row: DataRowSchema }), 'PATCH', { status: 'unpublished' })
      if ((await readPage(`/${slug}`)).includes(title)) throw new Error(`Unpublished entry still visible in ${slug}`)
      if (slug === 'angebote' && (await readPage('/wochenprogramm')).includes(title)) throw new Error('Unpublished offer still visible in weekly programme')
      await request(`/data/rows/${row.id}/publish`, Type.Object({}, { additionalProperties: true }), 'POST')
      if (!(await readPage(`/${slug}`)).includes(editedTitle)) throw new Error(`Restored entry missing from ${slug}`)
      console.info(`Verified ${slug}: draft hidden, pinned entry first, publication and updates visible, unpublication hidden, republishing visible.`)
    } finally {
      await request(`/data/rows/${row.id}`, Type.Object({}, { additionalProperties: true }), 'DELETE')
    }
    if ((await readPage(`/${slug}`)).includes(title)) throw new Error(`Deleted verification entry still visible in ${slug}`)
  }
  await request('/publish', Type.Object({}, { additionalProperties: true }), 'POST')
  const current = await request('/site', Type.Object({ site: SiteShellSchema, seq: Type.Number() }))
  const originalFramework = current.site.settings.framework
  if (!originalFramework) throw new Error('Framework was not persisted')
  const changedFramework = structuredClone(originalFramework)
  const primary = changedFramework.colors.tokens.find((token) => token.slug === 'jhv-primary')
  if (!primary) throw new Error('Primary color missing from CMS framework')
  primary.lightValue = '#80e0ff'
  const updateFramework = async (framework: typeof originalFramework) => {
    const { site: latest, seq: latestSeq } = await request('/site', Type.Object({ site: SiteShellSchema, seq: Type.Number() }))
    latest.settings.framework = framework
    await request('/site-document', Type.Object({ ok: Type.Boolean(), seq: Type.Number() }), 'PUT', {
      mode: 'incremental', site: latest, changedPages: [], deletedPageIds: [],
      changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
      baseSeqs: {}, shellBaseSeq: latestSeq,
    })
    await request('/publish', Type.Object({}, { additionalProperties: true }), 'POST')
  }
  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  try {
    await updateFramework(changedFramework)
    const page = await browser.newPage()
    await page.goto(baseUrl.href)
    const colors = await page.evaluate(() => ['.contact-link', '.ticker', '.flying-badge'].map((selector) => {
      const element = document.querySelector(selector)
      if (!element) throw new Error(`Missing themed element: ${selector}`)
      return getComputedStyle(element).backgroundColor
    }))
    if (colors.some((color) => color !== 'rgb(128, 224, 255)')) throw new Error(`Primary CMS token is not linked: ${colors.join(', ')}`)
    console.info('Verified framework: changing the CMS primary token changes published navigation, ticker and footer badges.')
    await page.context().addCookies([{
      name: 'instatic_admin_session', value: cookie.slice(cookie.indexOf('=') + 1),
      url: baseUrl.origin, httpOnly: true, sameSite: 'Lax',
    }])
    await page.goto(new URL('/admin/site', baseUrl).href)
    await page.getByRole('button', { name: 'Open Framework panel', exact: true }).click()
    await page.getByLabel('Colors', { exact: true }).click()
    await page.getByRole('button', { name: 'Edit color jhv-primary', exact: true }).click()
    if (await page.getByLabel('Token name', { exact: true }).inputValue() !== 'jhv-primary') throw new Error('Primary color unavailable in native framework editor')
    console.info('Verified native Framework → Colors: primary token opens in the editable color settings.')
  } finally {
    await browser.close()
    await updateFramework(originalFramework)
  }
}
await request('/logout', okSchema, 'POST')
console.info('Published nine pages, three entry templates, editable framework tokens and dynamic content loops.')
