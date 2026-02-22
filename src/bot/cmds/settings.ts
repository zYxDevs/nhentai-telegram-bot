import { eq } from 'drizzle-orm'
import { Composer, InlineKeyboard } from 'grammy'
import type { User } from 'grammy/types'
import config from '../../../config.js'
import { db } from '../../db/client.js'
import { usersTable } from '../../db/schema.js'
import Werror from '../../lib/error.js'

type UserSettings = {
	search_sorting: 'date' | 'popular'
	search_type: 'article' | 'photo'
	random_locally: boolean
	can_repeat_in_random: boolean
}

const composer = new Composer()

const defaults: UserSettings = {
	search_sorting: config.search_sorting_by_default === 'popular' ? 'popular' : 'date',
	search_type: config.search_appearance_by_default === 'article' ? 'article' : 'photo',
	random_locally: config.random_locally_by_default,
	can_repeat_in_random: config.can_repeat_in_random_by_default,
}

composer.command('settings', async (ctx) => {
	if (!ctx.from) {
		await ctx.reply('Settings are available only for user accounts')
		return
	}

	const settings = await loadSettings(ctx.from)
	const message = buildSettingsMessage(settings)

	await ctx.reply(message, {
		parse_mode: 'HTML',
		reply_markup: buildSettingsKeyboard(settings),
	})
})

composer.callbackQuery(/^settings:.+$/, async (ctx) => {
	if (!ctx.from) {
		await ctx.answerCallbackQuery({ text: 'No user context' })
		return
	}

	const action = ctx.callbackQuery.data.split(':')[1]
	if (!action) {
		await ctx.answerCallbackQuery({ text: 'Unknown action' })
		return
	}

	let settings = await loadSettings(ctx.from)

	switch (action) {
	case 'sort_date':
		settings.search_sorting = 'date'
		break
	case 'sort_popular':
		settings.search_sorting = 'popular'
		break
	case 'type_article':
		settings.search_type = 'article'
		break
	case 'type_photo':
		settings.search_type = 'photo'
		break
	case 'toggle_random_local':
		settings.random_locally = !settings.random_locally
		break
	case 'toggle_random_repeat':
		settings.can_repeat_in_random = !settings.can_repeat_in_random
		break
	case 'reset':
		settings = { ...defaults }
		break
	default:
		await ctx.answerCallbackQuery({ text: 'Unknown action' })
		return
	}

	try {
		await saveSettings(ctx.from, settings)
	} catch (err) {
		throw new Werror(err, 'Saving user settings')
	}

	await ctx.answerCallbackQuery({ text: 'Saved' })
	await ctx.editMessageText(buildSettingsMessage(settings), {
		parse_mode: 'HTML',
		reply_markup: buildSettingsKeyboard(settings),
	})
})

function buildSettingsMessage(settings: UserSettings) {
	let message = '<b>Settings</b>\n\n'
	message += '<b>Search sorting:</b> ' + settings.search_sorting + '\n'
	message += '<b>Search appearance:</b> ' + settings.search_type + '\n'
	message += '<b>Random locally:</b> ' + (settings.random_locally ? 'enabled' : 'disabled') + '\n'
	message += '<b>Allow repeats in random:</b> '
	message += settings.can_repeat_in_random ? 'enabled' : 'disabled'

	return message
}

function buildSettingsKeyboard(settings: UserSettings) {
	return new InlineKeyboard()
		.text(
			(settings.search_sorting === 'date' ? config.check_mark + ' ' : '') + 'Sort: date',
			'settings:sort_date'
		)
		.text(
			(settings.search_sorting === 'popular' ? config.check_mark + ' ' : '') + 'Sort: popular',
			'settings:sort_popular'
		)
		.row()
		.text(
			(settings.search_type === 'article' ? config.check_mark + ' ' : '') + 'View: article',
			'settings:type_article'
		)
		.text(
			(settings.search_type === 'photo' ? config.check_mark + ' ' : '') + 'View: photo',
			'settings:type_photo'
		)
		.row()
		.text(
			(settings.random_locally ? config.check_mark + ' ' : '') + 'Random locally',
			'settings:toggle_random_local'
		)
		.row()
		.text(
			(settings.can_repeat_in_random ? config.check_mark + ' ' : '') + 'Allow repeat in random',
			'settings:toggle_random_repeat'
		)
		.row()
		.text('Reset defaults', 'settings:reset')
}

async function loadSettings(from: User) {
	const now = Math.floor(Date.now() / 1000)
	const userId = from.id.toString()

	await db
		.insert(usersTable)
		.values({
			id: userId,
			username: from.username,
			firstName: from.first_name,
			lastName: from.last_name,
			languageCode: from.language_code,
			settings: JSON.stringify(defaults),
			searchHistory: '[]',
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: usersTable.id,
			set: {
				username: from.username,
				firstName: from.first_name,
				lastName: from.last_name,
				languageCode: from.language_code,
				updatedAt: now,
			},
		})

	const rows = await db
		.select({ settings: usersTable.settings })
		.from(usersTable)
		.where(eq(usersTable.id, userId))
		.limit(1)

	return parseSettings(rows[0]?.settings)
}

function parseSettings(rawSettings?: string): UserSettings {
	if (!rawSettings) {
		return { ...defaults }
	}

	try {
		const parsed = JSON.parse(rawSettings) as Partial<UserSettings>
		return {
			search_sorting:
				parsed.search_sorting === 'popular' || parsed.search_sorting === 'date'
					? parsed.search_sorting
					: defaults.search_sorting,
			search_type:
				parsed.search_type === 'article' || parsed.search_type === 'photo'
					? parsed.search_type
					: defaults.search_type,
			random_locally:
				typeof parsed.random_locally === 'boolean' ? parsed.random_locally : defaults.random_locally,
			can_repeat_in_random:
				typeof parsed.can_repeat_in_random === 'boolean'
					? parsed.can_repeat_in_random
					: defaults.can_repeat_in_random,
		}
	} catch {
		return { ...defaults }
	}
}

async function saveSettings(
	from: User,
	settings: UserSettings
) {
	const now = Math.floor(Date.now() / 1000)

	await db
		.update(usersTable)
		.set({
			username: from.username,
			firstName: from.first_name,
			lastName: from.last_name,
			languageCode: from.language_code,
			settings: JSON.stringify(settings),
			updatedAt: now,
		})
		.where(eq(usersTable.id, from.id.toString()))
}

export default composer
