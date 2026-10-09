import { afterEach, describe, expect, it } from 'bun:test'
import { createCapabilityTestHarness, readJson, type CapabilityTestHarness } from '../helpers/capabilityHarness'
import type { DataRow } from '@core/data/schemas'
import { previewCmsDataLoopItems, publishCmsDataRow, saveCmsDataRowDraft } from '@core/persistence/cmsData'
import type { FetchLike } from '@core/http'

let harness: CapabilityTestHarness | null = null
afterEach(async () => {
  await harness?.cleanup()
  harness = null
})

describe('pinned loop preview HTTP round-trip', () => {
  it('saves and publishes native pins and previews the same priority as the public source', async () => {
    const app = await createCapabilityTestHarness()
    harness = app
    const cookie = await app.setupOwner()
    const ids: string[] = []
    for (const [slug, date, pinned] of [
      ['old-pinned', '2020-01-01', true],
      ['newest', '2026-01-01', false],
    ] as const) {
      const created = await app.cms('/admin/api/cms/data/tables/posts/rows', {
        method: 'POST', cookie, json: { cells: { title: slug, slug, date, pinned } },
      })
      expect(created.status).toBe(201)
      const { row } = await readJson<{ row: DataRow }>(created)
      expect(row.cells.pinned).toBe(pinned)
      const published = await app.cms(`/admin/api/cms/data/rows/${row.id}/publish`, { method: 'POST', cookie })
      expect(published.status).toBe(200)
      ids.push(row.id)
    }
    const fetchImpl: FetchLike = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      return app.cms(url, { ...init, cookie })
    }
    const options = { orderBy: 'cell:date', direction: 'desc' as const, limit: 1 }
    const normal = await previewCmsDataLoopItems('posts', options, fetchImpl)
    const pinned = await previewCmsDataLoopItems('posts', { ...options, pinnedFirst: true }, fetchImpl)
    const next = await previewCmsDataLoopItems('posts', { ...options, pinnedFirst: true, offset: 1 }, fetchImpl)
    expect(normal.items.map((item) => item.id)).toEqual([ids[1]!])
    expect(pinned.items.map((item) => item.id)).toEqual([ids[0]!])
    expect(next.items.map((item) => item.id)).toEqual([ids[1]!])
    expect(pinned.totalItems).toBe(2)
    const saved = await saveCmsDataRowDraft(ids[0]!, {
      cells: { title: 'old-pinned', slug: 'old-pinned', date: '2020-01-01', pinned: false },
    }, fetchImpl)
    expect(saved.cells.pinned).toBe(false)
    const beforePublish = await previewCmsDataLoopItems('posts', { ...options, pinnedFirst: true }, fetchImpl)
    expect(beforePublish.items.map((item) => item.id)).toEqual([ids[0]!])
    await publishCmsDataRow(ids[0]!, fetchImpl)
    const unpinned = await previewCmsDataLoopItems('posts', { ...options, pinnedFirst: true }, fetchImpl)
    expect(unpinned.items.map((item) => item.id)).toEqual([ids[1]!])
    expect(saved.cells.date).toBe('2020-01-01')
  })
})
