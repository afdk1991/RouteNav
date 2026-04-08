import { pgTable, serial, text, numeric, boolean, timestamp, integer } from 'drizzle-orm/pg-core';

export const addresses = pgTable('addresses', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  latitude: numeric('latitude').notNull(),
  longitude: numeric('longitude').notNull(),
  city: text('city'),
  isStart: boolean('is_start').default(false),
  isEnd: boolean('is_end').default(false),
  orderIndex: integer('order_index').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const routes = pgTable('routes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  optimizationMode: text('optimization_mode').notNull(), // 'shortest', 'balanced', 'regional'
  totalDistance: numeric('total_distance').notNull(),
  addressIds: text('address_ids').notNull(), // JSON array of address IDs
  orderedAddresses: text('ordered_addresses').notNull(), // JSON array of ordered addresses
  createdAt: timestamp('created_at').defaultNow(),
});

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;
export type Route = typeof routes.$inferSelect;
export type NewRoute = typeof routes.$inferInsert;
