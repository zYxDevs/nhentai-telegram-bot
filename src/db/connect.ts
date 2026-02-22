import Werror from '../lib/error.js'
import { ensureDatabaseReady } from './client.js'

export default async function connectToDatabase() {
	try {
		await ensureDatabaseReady()
	} catch (error) {
		throw new Werror(error, 'Unable to connect to database :(')
	}

	console.log('SQLite is connected!')
}
