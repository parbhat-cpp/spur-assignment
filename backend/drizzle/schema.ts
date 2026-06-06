import { pgTable, unique, uuid, varchar, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	fullname: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	createdAt: integer().default(sql`'1780588290989'`).notNull(),
	updatedAt: integer().default(sql`'1780588290989'`).notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);
