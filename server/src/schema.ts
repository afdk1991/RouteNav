import { pgTable, serial, text, numeric, boolean, timestamp, integer, varchar } from 'drizzle-orm/pg-core';

// Users table for authentication
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Addresses table
export const addresses = pgTable('addresses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
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

// Routes table
export const routes = pgTable('routes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  optimizationMode: text('optimization_mode').notNull(), // 'shortest', 'balanced', 'regional'
  totalDistance: numeric('total_distance').notNull(),
  addressIds: text('address_ids').notNull(), // JSON array of address IDs
  orderedAddresses: text('ordered_addresses').notNull(), // JSON array of ordered addresses
  createdAt: timestamp('created_at').defaultNow(),
});

// Attractions table for popular places
export const attractions = pgTable('attractions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  latitude: numeric('latitude').notNull(),
  longitude: numeric('longitude').notNull(),
  city: text('city').notNull(),
  category: text('category').notNull(),
  region: text('region').notNull(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;
export type Route = typeof routes.$inferSelect;
export type NewRoute = typeof routes.$inferInsert;
export type Attraction = typeof attractions.$inferSelect;
export type NewAttraction = typeof attractions.$inferInsert;
