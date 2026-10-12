import { describe, expect, it } from 'bun:test'
import { hasUnpublishedChanges } from '../rowStatus'

describe('hasUnpublishedChanges', () => {
  it('is false for a published row whose draft was not edited after publishing', () => {
    expect(hasUnpublishedChanges({
      status: 'published',
      publishedAt: '2026-10-12T13:27:00.272Z',
      updatedAt: '2026-10-12T13:27:00.272Z',
    })).toBe(false)
  })

  it('is true for a published row with a draft saved after the last publish', () => {
    expect(hasUnpublishedChanges({
      status: 'published',
      publishedAt: '2026-09-30T09:38:27.442Z',
      updatedAt: '2026-10-12T13:16:29.593Z',
    })).toBe(true)
  })

  it('is true for drafts and unpublished rows, false for scheduled rows', () => {
    const times = { publishedAt: null, updatedAt: '2026-10-12T13:16:29.593Z' }
    expect(hasUnpublishedChanges({ status: 'draft', ...times })).toBe(true)
    expect(hasUnpublishedChanges({ status: 'unpublished', ...times })).toBe(true)
    expect(hasUnpublishedChanges({ status: 'scheduled', ...times })).toBe(false)
  })
})
