import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  fullname: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
});

export const conversationsTable = pgTable("conversations", {
  id: uuid().primaryKey().defaultRandom(),
  title: varchar({ length: 255 }).notNull(),
  userId: uuid().notNull().references(() => usersTable.id),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
});

export const messagesTable = pgTable("messages", {
  id: uuid().primaryKey().defaultRandom(),
  conversationId: uuid().notNull().references(() => conversationsTable.id),
  sender: varchar({ length: 255 }).notNull(),
  content: varchar({ length: 1000 }).notNull(),
  createdAt: timestamp().defaultNow(),
});
