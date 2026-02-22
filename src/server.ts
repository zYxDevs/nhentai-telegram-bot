import { pino } from 'pino'
import Werror from './lib/error.js'
import start from './bot/index.js'
import dotenv from 'dotenv'
import { ensureDatabaseReady } from './db/client.js'

dotenv.config()
const logger = pino()

const botToken = process.env['BOT_TOKEN']

if (!botToken)
	throw new Error('BOT_TOKEN is required')

try {
	await ensureDatabaseReady()
} catch (err) {
	throw new Werror(err, 'Failed to connect to the database')
}
logger.info('Database connection established')

await start(botToken, logger)
