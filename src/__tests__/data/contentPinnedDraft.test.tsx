import { afterEach, describe, expect, it, mock } from 'bun:test'
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { useContentEntryDraft } from '@content/hooks/useContentEntryDraft'
import { ContentSettingsPanel } from '@content/components/ContentSettingsPanel/ContentSettingsPanel'
import { buildPostTypeDefaultFields } from '@core/data/fields'
import type { DataRow, DataTable } from '@core/data/schemas'

const originalFetch = globalThis.fetch
afterEach(() => {
  cleanup()
  globalThis.fetch = originalFetch
})

function entry(id: string, pinned?: boolean): DataRow {
  return {
    id, tableId: 'posts', cells: { title: id, slug: id, ...(pinned === undefined ? {} : { pinned }) },
    slug: id, status: 'draft',
    authorUserId: null, createdByUserId: null, updatedByUserId: null, publishedByUserId: null,
    author: null, createdBy: null, updatedBy: null, publishedBy: null,
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    publishedAt: null, scheduledPublishAt: null, deletedAt: null,
  }
}

describe('Content native pin draft', () => {
  it('renders the native checkbox and respects entry edit permissions', () => {
    const selectedEntry = entry('news')
    const collection: DataTable = {
      id: 'posts', name: 'Posts', slug: 'posts', kind: 'postType',
      singularLabel: 'Post', pluralLabel: 'Posts', routeBase: '/posts', primaryFieldId: 'title',
      system: true, fields: buildPostTypeDefaultFields(),
      createdByUserId: null, updatedByUserId: null,
      createdAt: selectedEntry.createdAt, updatedAt: selectedEntry.updatedAt,
    }
    const onPinnedChange = mock((_value: boolean) => {})
    const props = {
      selectedEntry, authors: [], authorsLoading: false, collections: [collection], tables: [collection],
      selectedCollection: collection, loading: false,
      slug: 'news', slugId: 'slug', pinned: false, seoTitle: '', seoTitleId: 'seo-title',
      seoDescription: '', seoDescriptionId: 'seo-description', publicPath: '/posts/news',
      mediaError: null, featuredMediaId: null, featuredMediaAsset: null, customCells: {},
      canEditEntry: true, canMoveEntry: false, canPublishEntry: true, canChangeAuthor: false,
      onPinnedChange, onCollectionChange: () => {}, onAuthorChange: () => {}, onSlugChange: () => {},
      onSeoTitleChange: () => {}, onSeoDescriptionChange: () => {}, onCustomCellChange: () => {},
      onStatusChange: () => {}, onChooseFeaturedMedia: () => {}, onClearFeaturedMedia: () => {},
      onEditFeaturedMedia: () => {},
    }
    const view = render(<ContentSettingsPanel {...props} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /Keep at top/ }))
    expect(onPinnedChange).toHaveBeenCalledWith(true)
    view.rerender(<ContentSettingsPanel {...props} pinned canEditEntry={false} />)
    const checkbox = screen.getByRole('checkbox', { name: /Keep at top/ })
    expect(checkbox.getAttribute('disabled')).not.toBeNull()
    expect(checkbox.getAttribute('type')).toBe('checkbox')
  })

  it('defaults missing pins to false and tracks toggling as a dirty edit', () => {
    const { result } = renderHook(() => useContentEntryDraft({
      selectedEntry: entry('old'), updateSelectedEntry: () => {}, setError: () => {},
    }))
    expect(result.current.pinned).toBe(false)
    expect(result.current.isDirty).toBe(false)
    act(() => result.current.setPinned(true))
    expect(result.current.isDirty).toBe(true)
    act(() => result.current.setPinned(false))
    expect(result.current.isDirty).toBe(false)
  })

  it('loads pin state on selection and keeps it out of custom cells', () => {
    const { result, rerender } = renderHook(
      ({ selectedEntry }) => useContentEntryDraft({
        selectedEntry, updateSelectedEntry: () => {}, setError: () => {},
      }),
      { initialProps: { selectedEntry: entry('pinned', true) } },
    )
    expect(result.current.pinned).toBe(true)
    expect(result.current.customCells).not.toHaveProperty('pinned')
    rerender({ selectedEntry: entry('other') })
    expect(result.current.pinned).toBe(false)
    expect(result.current.isDirty).toBe(false)
  })

  it('saves and publishes the pin through the normal entry lifecycle', async () => {
    const selectedEntry = entry('news')
    const saved = { ...selectedEntry, cells: { ...selectedEntry.cells, pinned: true } }
    const published = { ...saved, status: 'published' as const, publishedAt: '2026-01-02T00:00:00.000Z' }
    const requests: Array<{ url: string; body: string | undefined }> = []
    globalThis.fetch = mock(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input)
      requests.push({ url, body: typeof init?.body === 'string' ? init.body : undefined })
      return Response.json({ row: url.endsWith('/publish') ? published : saved })
    })
    const updateSelectedEntry = mock((_row: DataRow) => {})
    const setError = mock((_message: string | null) => {})
    const { result } = renderHook(() => useContentEntryDraft({
      selectedEntry, updateSelectedEntry, setError,
    }))
    act(() => result.current.setPinned(true))
    await act(async () => { await result.current.handlePublish() })
    expect(requests).toHaveLength(2)
    expect(JSON.parse(requests[0]?.body ?? '{}').cells.pinned).toBe(true)
    expect(requests[1]?.url).toEndWith('/publish')
    expect(result.current.saveMessage).toBe('published')
    expect(updateSelectedEntry.mock.calls[0]?.[0].cells.pinned).toBe(true)
    expect(setError).toHaveBeenCalledWith(null)
  })
})
