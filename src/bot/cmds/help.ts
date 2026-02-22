import { Composer } from 'grammy'
import config from '../../../config.js'

const composer = new Composer()

composer.command('help', async (ctx) => {
	let message = 'Commands:\n'
	message += '/start - welcome message\n'
	message += '/rand - random doujin\n'
	message += '/id <code> - load doujin by id\n'
	message += '/zip <code> - download doujin pages as ZIP\n'
	message += '/settings - bot preferences\n\n'
	message += 'Inline mode: type @' + config.bot_username + ' <query>\n\n'

	if (config.donation_wallets.length > 0) {
		message += 'Donations:\n'
		for (const wallet of config.donation_wallets) {
			message += '- ' + wallet.name + ': <code>' + wallet.address + '</code>\n'
		}
		message += '\n'
	}

	message += '<a href="https://github.com/sleroq/nhentai-telegram-bot">GitHub</a>'

	await ctx.reply(message, {
		parse_mode: 'HTML',
		link_preview_options: {
			is_disabled: true,
		},
	})
})

export default composer
