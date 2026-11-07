import { pgTable, text, bigint, bigserial, doublePrecision, index } from 'drizzle-orm/pg-core'

export const links = pgTable('links', {
  id: text().primaryKey(),
  label: text().notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
})

export const locations = pgTable('locations', {
  sequence: bigserial({ mode: 'number' }).primaryKey(),
  linkId: text('link_id').notNull().references(() => links.id, { onDelete: 'cascade' }),
  lat: doublePrecision().notNull(),
  lng: doublePrecision().notNull(),
  accuracy: doublePrecision(),
  at: bigint({ mode: 'number' }).notNull(),
}, (table) => [index('locations_link_id_idx').on(table.linkId)])
