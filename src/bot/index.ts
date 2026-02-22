import { Bot, BotError } from 'grammy'
import type { Logger } from 'pino'
import handleIDs from './cmds/by-ids.js'
import help from './cmds/help.js'
import settings from './cmds/settings.js'
import zip from './cmds/zip.js'
import Werror from '../lib/error.js'
import search from './search.js'
import opener from './buttons/open.js'
import rand from './cmds/rand.js'

export default async function startBot(token: string, logger: Logger) {
	const bot = new Bot(token)

	bot.catch((err: BotError) => {
		logger.error(err)
	})

	bot.command('start', ctx => {
		let message = 'Welcome!\n'
		message += '/rand - random doujin\n'
		message += '/settings - preferences\n'
		message += '/zip <id> - download pages as zip\n'
		message += '/help - all commands\n'
		message += '<code>123123</code> - doujin by id\n\n'
		message += '<a href="https://github.com/sleroq/nhentai-telegram-bot">GitHub</a> - help with development\n'

		return ctx.reply(message, {
			parse_mode: 'HTML',
			link_preview_options: {
				is_disabled: true,
			},
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: 'Search',
							switch_inline_query_current_chat: '',
						}
					],
				],
			}
		})
	})

	bot.command('id', async (ctx) => {
		await ctx.reply('Just send me the id, no need to type /id command')

		const id = ctx.msg.text.split(' ')[1]?.trim()
		if (!id) return

		try {
			await handleIDs([id], ctx, logger)
		} catch (err) {
			throw new Werror(err, 'Error handling doujin id')
		}
	})

	bot.use(search)
	bot.use(opener)
	bot.use(rand)
	bot.use(help)
	bot.use(settings)
	bot.use(zip)

	bot.on('message', async (ctx) => {
		if (ctx.msg.via_bot?.id === bot.botInfo.id) return

		const ids = ctx.msg.text?.match(/\d+/gm)
		if (ids && ids.length) {
			if (ids.length > 20) {
				return ctx.reply('Please provide at most 20 ids')
			}

			try {
				await handleIDs(ids, ctx, logger)
			} catch (err) {
				throw new Werror(err, 'Error handling doujin ids')
			}
		}

		return
	})

	void bot.start()
}
