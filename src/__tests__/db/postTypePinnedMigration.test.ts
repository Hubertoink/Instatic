import { expect, it } from 'bun:test'
import { createSqliteClient } from '../../../server/db/sqlite'
import { runMigrations } from '../../../server/db/runMigrations'
import { sqliteMigrations } from '../../../server/db/migrations-sqlite'
import { getDataTable } from '../../../server/repositories/data'
import { MAIN_SCOPE } from '../../../server/branches/scope'

it('upgrades existing post-type collections additively without changing stored content', async () => {
  const db = createSqliteClient(':memory:')
  try {
    const pinnedIndex = sqliteMigrations.findIndex((migration) => migration.id === '033_post_type_pinned')
    expect(pinnedIndex).toBeGreaterThan(0)
    await runMigrations(db, sqliteMigrations.slice(0, pinnedIndex))
    const existingFields = [{ type: 'text', id: 'custom', label: 'Custom' }]
    for (const [id, kind] of [['existing-news', 'postType'], ['ordinary-data', 'data']] as const) {
      await db`
        insert into data_tables (id, name, slug, kind, singular_label, plural_label, fields_json, system)
        values (${id}, ${id}, ${id}, ${kind}, 'Entry', 'Entries', ${existingFields}, ${false})
      `
    }
    const cells = { title: 'Existing news', slug: 'existing-news', custom: 'Preserved', date: '2020-01-01' }
    await db`
      insert into data_rows (id, table_id, cells_json, slug, status)
      values ('existing-row', 'existing-news', ${cells}, 'existing-news', 'published')
    `
    await db`
      insert into data_row_versions (id, row_id, version_number, cells_json, slug)
      values ('existing-version', 'existing-row', 1, ${cells}, 'existing-news')
    `
    await runMigrations(db, sqliteMigrations)
    await runMigrations(db, sqliteMigrations)
    const news = await getDataTable(db, MAIN_SCOPE, 'existing-news')
    expect(news?.fields).toEqual([
      ...existingFields,
      { type: 'boolean', id: 'pinned', label: 'Keep at top', defaultValue: false, builtIn: true },
    ])
    expect((await getDataTable(db, MAIN_SCOPE, 'ordinary-data'))?.fields).toEqual(existingFields)
    const rows = await db<{ cells_json: Record<string, unknown> }>`select cells_json from data_rows where id = 'existing-row'`
    const versions = await db<{ cells_json: Record<string, unknown> }>`select cells_json from data_row_versions where id = 'existing-version'`
    expect(rows.rows[0]?.cells_json).toEqual(cells)
    expect(versions.rows[0]?.cells_json).toEqual(cells)
  } finally {
    await db.close()
  }
})
