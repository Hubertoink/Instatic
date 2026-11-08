import { expect, it } from 'bun:test'
import { createSqliteClient } from '../../../server/db/sqlite'
import { runMigrations } from '../../../server/db/runMigrations'
import { sqliteMigrations } from '../../../server/db/migrations-sqlite'

it('upgrades the Hochstaett fork without replaying its migrations or changing content', async () => {
  const db = createSqliteClient(':memory:')
  try {
    const pluginId = '031_data_tables_created_by_plugin'
    const forkMigrations = sqliteMigrations.filter((migration) => migration.id !== pluginId)
    await runMigrations(db, forkMigrations)
    const fields = [{ type: 'text', id: 'title', label: 'Title' }]
    const cells = { title: 'Preserved news', date: '2020-01-01', pinned: true }
    await db`
      insert into data_tables (id, name, slug, kind, singular_label, plural_label, fields_json, system)
      values ('existing-news', 'News', 'existing-news', 'postType', 'Entry', 'Entries', ${fields}, ${false})
    `
    await db`
      insert into data_rows (id, table_id, cells_json, slug, status)
      values ('existing-row', 'existing-news', ${cells}, 'existing-news', 'published')
    `
    await db`
      insert into data_row_versions (id, row_id, version_number, cells_json, slug)
      values ('existing-version', 'existing-row', 1, ${cells}, 'existing-news')
    `
    const before = await db<{ id: string; applied_at: string }>`select id, applied_at from schema_migrations order by id`
    await runMigrations(db, sqliteMigrations)
    await runMigrations(db, sqliteMigrations)
    const after = await db<{ id: string; applied_at: string }>`select id, applied_at from schema_migrations order by id`
    expect(after.rows.filter((migration) => migration.id !== pluginId)).toEqual(before.rows)
    expect(after.rows.filter((migration) => migration.id === pluginId)).toHaveLength(1)
    const tables = await db<{ fields_json: unknown; created_by_plugin_id: string | null }>`
      select fields_json, created_by_plugin_id from data_tables where id = 'existing-news'
    `
    expect(tables.rows[0]).toEqual({ fields_json: fields, created_by_plugin_id: null })
    const rows = await db<{ cells_json: unknown }>`select cells_json from data_rows where id = 'existing-row'`
    const versions = await db<{ cells_json: unknown }>`select cells_json from data_row_versions where id = 'existing-version'`
    expect(rows.rows[0]?.cells_json).toEqual(cells)
    expect(versions.rows[0]?.cells_json).toEqual(cells)
  } finally {
    await db.close()
  }
})
