import { integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const mangaTable = sqliteTable('manga', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description').notNull(),
	tags: text('tags').notNull(),
	pages: integer('pages').notNull(),
	thumbnail: text('thumbnail').notNull(),
	previewTelegraphUrl: text('preview_telegraph_url').notNull(),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull(),
})

export const usersTable = sqliteTable('users', {
	id: text('id').primaryKey(),
	username: text('username'),
	firstName: text('first_name'),
	lastName: text('last_name'),
	languageCode: text('language_code'),
	settings: text('settings').notNull().default('{}'),
	searchHistory: text('search_history').notNull().default('[]'),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull(),
})

export const messagesTable = sqliteTable(
	'messages',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		chatId: text('chat_id').notNull(),
		messageId: integer('message_id').notNull(),
		current: integer('current'),
		createdAt: integer('created_at').notNull(),
		updatedAt: integer('updated_at').notNull(),
	},
	(table) => [uniqueIndex('messages_chat_id_message_id_idx').on(table.chatId, table.messageId)]
)

export const userFavoritesTable = sqliteTable(
	'user_favorites',
	{
		userId: text('user_id').notNull(),
		mangaId: text('manga_id').notNull(),
		createdAt: integer('created_at').notNull(),
	},
	(table) => [primaryKey({ columns: [table.userId, table.mangaId] })]
)

export const userHistoryTable = sqliteTable(
	'user_history',
	{
		userId: text('user_id').notNull(),
		mangaId: text('manga_id').notNull(),
		createdAt: integer('created_at').notNull(),
	},
	(table) => [primaryKey({ columns: [table.userId, table.mangaId] })]
)

export const userSearchHistoryTable = sqliteTable('user_search_history', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: text('user_id').notNull(),
	query: text('query').notNull(),
	createdAt: integer('created_at').notNull(),
})

export const messageHistoryTable = sqliteTable(
	'message_history',
	{
		chatId: text('chat_id').notNull(),
		messageId: integer('message_id').notNull(),
		mangaId: text('manga_id').notNull(),
		createdAt: integer('created_at').notNull(),
	},
	(table) => [primaryKey({ columns: [table.chatId, table.messageId, table.mangaId] })]
)
