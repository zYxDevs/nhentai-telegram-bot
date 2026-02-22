import { eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { mangaTable } from '../db/schema.js'
import { Manga } from '../models/manga.model.js'
import Werror from './error.js'
import Doujin from '../sources/doujin.js'
import HentaiAPI from '../sources/index.js'
import { escape } from 'html-escaper'

// getDoujin function tries to find doujin in database and if it doesn't exist, it will fetch it
export default async function getDoujin(id: string) {
	const source = 'ehentai.io'
	const databaseID = `${source}_${id}`

	let doujin: Manga | null
	try {
		const cachedManga = await db
			.select()
			.from(mangaTable)
			.where(eq(mangaTable.id, databaseID))
			.limit(1)

		doujin = cachedManga[0] ? mapMangaRow(cachedManga[0]) : null
	} catch (err) {
		throw new Werror(err, 'Error getting doujin from database')
	}

	if (doujin) return doujin

	const hentaiAPI = new HentaiAPI()
	let fetchedDoujin: Doujin
	try {
		fetchedDoujin = await hentaiAPI.doujin(id)
	} catch (err) {
		throw new Werror(err, 'Error fetching doujin from internet')
	}

	const previewURL = new URL('https://t.me/iv?rhash=cadd02903410b2')
	previewURL.searchParams.set('url', fetchedDoujin.url)

	try {
		doujin = await saveDoujin(fetchedDoujin, databaseID, previewURL.toString())
	} catch (err) {
		throw new Werror(err, 'Error saving doujin to database')
	}

	return doujin
}

export async function saveDoujin(doujin: Doujin, databaseID: string, previewURL: string) {
	const now = Math.floor(Date.now() / 1000)
	const description = generateDescription(doujin, previewURL.toString())

	try {
		await db
			.insert(mangaTable)
			.values({
				id: databaseID,
				title: doujin.title.translated.pretty,
				tags: JSON.stringify(doujin.details.tags.map((tag) => tag.name)),
				pages: doujin.details.pages,
				thumbnail: doujin.thumbnail,
				description,
				previewTelegraphUrl: previewURL.toString(),
				createdAt: now,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: mangaTable.id,
				set: {
					title: doujin.title.translated.pretty,
					tags: JSON.stringify(doujin.details.tags.map((tag) => tag.name)),
					pages: doujin.details.pages,
					thumbnail: doujin.thumbnail,
					description,
					previewTelegraphUrl: previewURL.toString(),
					updatedAt: now,
				},
			})
	} catch (err) {
		throw new Werror(err, 'Error saving doujin to database')
	}

	return {
		id: databaseID,
		title: doujin.title.translated.pretty,
		tags: doujin.details.tags.map((tag) => tag.name),
		pages: doujin.details.pages,
		thumbnail: doujin.thumbnail,
		description,
		previews: {
			telegraph_url: previewURL.toString(),
		},
		createdAt: new Date(now * 1000),
		updatedAt: new Date(now * 1000),
	}
}

function mapMangaRow(row: typeof mangaTable.$inferSelect): Manga {
	return {
		id: row.id,
		title: row.title,
		description: row.description,
		tags: parseTags(row.tags),
		pages: row.pages,
		thumbnail: row.thumbnail,
		previews: {
			telegraph_url: row.previewTelegraphUrl,
		},
		createdAt: new Date(row.createdAt * 1000),
		updatedAt: new Date(row.updatedAt * 1000),
	}
}

function parseTags(tags: string) {
	try {
		const parsedTags = JSON.parse(tags)
		if (Array.isArray(parsedTags)) return parsedTags.filter((tag) => typeof tag === 'string')
	} catch {
		return []
	}

	return []
}

function generateDescription(doujin: Doujin, previewURL: string) {
	const { title, details, url } = doujin
	const { tags, pages, categories, characters, artists } = details

	const categoriesArray = categories.map((category) => category.name)

	let description = ''

	description += `<a href="${previewURL}">${title.translated.pretty[0]}</a>`
	description += `<a href="${url}">${escape(
		title.translated.pretty.slice(1)
	)}</a>\n`
	description += `<b>Pages:</b> ${escape(pages.toString())}\n`

	if (categoriesArray.length > 0)
		description += `<b>Categories:</b> ${escape(categoriesArray.join(', '))}\n`
	if (characters.length > 0)
		description += `<b>Characters:</b> ${escape(
			characters.map((character) => character.name).join(', ')
		)}\n`
	if (tags.length > 0)
		description += `<b>Tags:</b> #${escape(
			tags.map((tag) => tag.name.replace(' ', '_')).join(' #')
		)}\n`
	if (artists.length > 0)
		description += `<b>Artists:</b> ${escape(
			artists.map((artist) => artist.name).join(', ')
		)}\n`

	return description
}
