import fs from 'node:fs'
import path from 'node:path'
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import * as schema from './schema.js'

const sqlitePath = process.env['SQLITE_PATH'] ?? './data/bot.sqlite'
const resolvedSqlitePath = path.resolve(sqlitePath)

fs.mkdirSync(path.dirname(resolvedSqlitePath), { recursive: true })

const sqlite = new Database(resolvedSqlitePath)

sqlite.run('PRAGMA journal_mode = WAL')
sqlite.run('PRAGMA foreign_keys = ON')

export const db = drizzle({ client: sqlite, schema })

export async function ensureDatabaseReady() {
	sqlite.exec(`
		CREATE TABLE IF NOT EXISTS manga (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			description TEXT NOT NULL,
			tags TEXT NOT NULL,
			pages INTEGER NOT NULL,
			thumbnail TEXT NOT NULL,
			preview_telegraph_url TEXT NOT NULL,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		);

		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			username TEXT,
			first_name TEXT,
			last_name TEXT,
			language_code TEXT,
			settings TEXT NOT NULL DEFAULT '{}',
			search_history TEXT NOT NULL DEFAULT '[]',
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		);

		CREATE TABLE IF NOT EXISTS messages (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			chat_id TEXT NOT NULL,
			message_id INTEGER NOT NULL,
			current INTEGER,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL,
			UNIQUE(chat_id, message_id)
		);

		CREATE TABLE IF NOT EXISTS user_favorites (
			user_id TEXT NOT NULL,
			manga_id TEXT NOT NULL,
			created_at INTEGER NOT NULL,
			PRIMARY KEY (user_id, manga_id),
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS user_history (
			user_id TEXT NOT NULL,
			manga_id TEXT NOT NULL,
			created_at INTEGER NOT NULL,
			PRIMARY KEY (user_id, manga_id),
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS user_search_history (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id TEXT NOT NULL,
			query TEXT NOT NULL,
			created_at INTEGER NOT NULL,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS message_history (
			chat_id TEXT NOT NULL,
			message_id INTEGER NOT NULL,
			manga_id TEXT NOT NULL,
			created_at INTEGER NOT NULL,
			PRIMARY KEY (chat_id, message_id, manga_id),
			FOREIGN KEY (chat_id, message_id) REFERENCES messages(chat_id, message_id) ON DELETE CASCADE,
			FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE CASCADE
		);
	`)
}
