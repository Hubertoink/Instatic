import type { DataRow } from './schemas'

/**
 * True when the row's draft cells differ from what the public site serves.
 * A published row keeps `status: 'published'` after a draft save, so the
 * draft is only live once `publishedAt` catches up with `updatedAt`.
 */
export function hasUnpublishedChanges(row: Pick<DataRow, 'status' | 'publishedAt' | 'updatedAt'>): boolean {
  if (row.status === 'scheduled') return false
  if (row.status !== 'published') return true
  if (row.publishedAt === null) return true
  return new Date(row.updatedAt).getTime() > new Date(row.publishedAt).getTime()
}
