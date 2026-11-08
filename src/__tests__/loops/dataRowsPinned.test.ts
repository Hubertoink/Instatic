import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { createTestDb, type TestDb } from '../helpers/createTestDb'
import { DataRowsSource, fetchPublishedDataRowItems } from '@core/loops/sources/dataRows'
import { getDataTable } from '../../../server/repositories/data'
import { MAIN_SCOPE } from '../../../server/branches/scope'

let testDb: TestDb

beforeAll(async () => {
  testDb = await createTestDb()
  const db = testDb.db
  for (const [slug, date, pinned, tag] of [
    ['old-pinned', '2023-01-01', true, 'news'],
    ['new-pinned', '2023-02-01', true, 'news'],
    ['newest', '2026-02-01', false, 'news'],
    ['missing', '2026-01-01', undefined, 'news'],
    ['excluded', '2026-03-01', true, 'guide'],
  ] as const) {
    const cells = { title: slug, date, ...(pinned === undefined ? {} : { pinned }), tag }
    const publishedAt = `${date}T00:00:00.000Z`
    await db`
      insert into data_rows (id, table_id, cells_json, slug, status, created_at, updated_at)
      values (${slug}, 'posts', ${cells}, ${slug}, 'published', ${publishedAt}, ${publishedAt})
    `
    await db`
      insert into data_row_versions (id, row_id, version_number, cells_json, slug, published_at, created_at)
      values (${`${slug}-v1`}, ${slug}, 1, ${cells}, ${slug}, ${publishedAt}, ${publishedAt})
    `
    await db`update data_rows set active_version_id = ${`${slug}-v1`} where id = ${slug}`
  }
  // Unsaved/unpublished pin changes must not affect the published snapshot.
  await db`update data_rows set cells_json = ${{ title: 'newest', date: '2026-02-01', pinned: true, tag: 'news' }} where id = 'newest'`
  await db`
    insert into data_rows (id, table_id, cells_json, slug, status)
    values ('draft-pin', 'posts', ${{ title: 'Draft', pinned: true, tag: 'news', date: '2027-01-01' }}, 'draft-pin', 'draft')
  `
  await db`
    insert into data_tables (id, name, slug, kind, singular_label, plural_label, fields_json, system)
    values ('plain-data', 'Plain data', 'plain-data', 'data', 'Item', 'Items', ${[]}, ${false})
  `
  for (const [slug, pinned] of [['a', false], ['z', true]] as const) {
    await db`
      insert into data_rows (id, table_id, cells_json, slug, status)
      values (${`data-${slug}`}, 'plain-data', ${{ name: slug, pinned }}, ${slug}, 'draft')
    `
  }
})

afterAll(async () => { await testDb.cleanup() })

function fetchNews(overrides: Partial<Parameters<typeof fetchPublishedDataRowItems>[1]> = {}) {
  return fetchPublishedDataRowItems(testDb.db, {
    tableId: 'posts',
    orderBy: 'cell:date',
    direction: 'desc',
    limit: 50,
    offset: 0,
    cellFilter: { field: 'tag', operator: 'is', value: 'news' },
    ...overrides,
  })
}

describe('pinned post-type entries', () => {
  it('adds the native field to existing posts without changing entry cells', async () => {
    const table = await getDataTable(testDb.db, MAIN_SCOPE, 'posts')
    expect(table?.fields.find((field) => field.id === 'pinned')).toMatchObject({
      type: 'boolean', builtIn: true, defaultValue: false,
    })
  })

  it('keeps existing ordering when the loop option is absent or off', async () => {
    for (const pinnedFirst of [undefined, false]) {
      const result = await fetchNews({ pinnedFirst })
      expect(result.items.map((item) => item.id)).toEqual(['newest', 'missing', 'new-pinned', 'old-pinned'])
    }
  })

  it('puts pinned entries first while retaining descending date order in both groups', async () => {
    const result = await fetchNews({ pinnedFirst: true })
    expect(result.items.map((item) => item.id)).toEqual(['new-pinned', 'old-pinned', 'newest', 'missing'])
    expect(result.totalItems).toBe(4)
    expect(result.items[0]?.fields.date).toBe('2023-02-01')
  })

  it('keeps pinned entries first even with ascending order', async () => {
    const result = await fetchNews({ pinnedFirst: true, direction: 'asc' })
    expect(result.items.map((item) => item.id)).toEqual(['old-pinned', 'new-pinned', 'missing', 'newest'])
  })

  it('also works with a built-in date column', async () => {
    const result = await fetchNews({ pinnedFirst: true, orderBy: 'publishedAt' })
    expect(result.items.map((item) => item.id)).toEqual(['new-pinned', 'old-pinned', 'newest', 'missing'])
  })

  it('applies priority before pagination, without duplicates or changing the total', async () => {
    const first = await fetchNews({ pinnedFirst: true, limit: 1 })
    const second = await fetchNews({ pinnedFirst: true, limit: 2, offset: 1 })
    const third = await fetchNews({ pinnedFirst: true, limit: 2, offset: 3 })
    expect([...first.items, ...second.items, ...third.items].map((item) => item.id))
      .toEqual(['new-pinned', 'old-pinned', 'newest', 'missing'])
    expect([first.totalItems, second.totalItems, third.totalItems]).toEqual([4, 4, 4])
  })

  it('uses published pin state, not draft edits, and excludes drafts and filtered entries', async () => {
    const result = await fetchNews({ pinnedFirst: true })
    expect(result.items.find((item) => item.id === 'newest')?.fields.pinned).toBe(false)
    expect(result.items.some((item) => ['excluded', 'draft-pin'].includes(item.id))).toBe(false)
  })

  it('respects draft pins when previewing branch content', async () => {
    const result = await fetchNews({ pinnedFirst: true, drafts: true })
    expect(result.items.map((item) => item.id)).toEqual(['draft-pin', 'newest', 'new-pinned', 'old-pinned', 'missing'])
  })

  it('threads the loop filters into the shared fetch path', async () => {
    const result = await DataRowsSource.fetch({
      db: testDb.db,
      filters: { tableId: 'posts', pinnedFirst: true, cellField: 'tag', cellOperator: 'is', cellValue: 'news' },
      orderBy: 'cell:date', direction: 'desc', limit: 1, offset: 0,
    })
    expect(result.items.map((item) => item.id)).toEqual(['new-pinned'])
    expect(result.totalItems).toBe(4)
  })

  it('does not change ordinary data tables', async () => {
    const result = await fetchNews({
      tableId: 'plain-data', pinnedFirst: true, cellFilter: null, orderBy: 'slug', direction: 'asc',
    })
    expect(result.items.map((item) => item.fields.slug)).toEqual(['a', 'z'])
  })
})
