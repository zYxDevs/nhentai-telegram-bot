import { IncomingHttpHeaders } from 'http'
import * as nhentai from 'nhentai'
import { CookieJar } from 'tough-cookie'
import Doujin, { Tag } from './doujin.js'
import { NotFoundError, searchResult, Source } from './index.js'
import resolveSourceRequestOptions, { SourceRequestOptions } from './request-options.js'

export interface NHentaiOptions {
	baseUrl?: string
	cookieJar?: CookieJar
	headers?: IncomingHttpHeaders
	requestOptions?: Partial<SourceRequestOptions>
}

export default class NHentai implements Source {
	baseUrl: string
	cookieJar: CookieJar
	headers: IncomingHttpHeaders
	private api: nhentai.API

	constructor(options?: NHentaiOptions) {
		this.baseUrl = options?.baseUrl || 'https://nhentai.net'
		this.cookieJar = options?.cookieJar || new CookieJar()
		this.headers = options?.headers || {}

		const requestOptions = resolveSourceRequestOptions(options?.requestOptions)

		this.api = new nhentai.API(
			requestOptions.flaresolverrUrl
				? { flaresolverrUrl: requestOptions.flaresolverrUrl }
				: undefined
		)
	}

	async doujin(identifier: string): Promise<Doujin> {
		const doujin = await this.api.fetchDoujin(identifier)
		if (!doujin) {
			throw new NotFoundError('Doujin not found: ' + identifier)
		}

		return this.mapDoujin(doujin)
	}

	async random(): Promise<Doujin> {
		const doujin = await this.api.randomDoujin()
		return this.mapDoujin(doujin)
	}

	async search(query: string, page = 1): Promise<searchResult> {
		const result = await this.api.search(query, { page })

		const results = result.doujins.map((d) => ({
			id: d.id.toString(),
			url: d.url,
			thumbnail: d.thumbnail.url,
			caption: d.titles.pretty || d.titles.english || d.titles.japanese,
		}))

		return {
			results,
			total: result.numPages * result.doujinsPerPage,
		}
	}

	private mapDoujin(doujin: nhentai.Doujin): Doujin {
		const pages = doujin.pages.map((p) => p.url)

		const mapTags = (tags: nhentai.Tag[]): Tag[] =>
			tags.map((t) => ({
				name: t.name,
				url: t.url,
			}))

		return {
			id: doujin.id.toString(),
			url: doujin.url,
			pages,
			thumbnail: doujin.cover.url,
			title: {
				translated: {
					full: doujin.titles.english || doujin.titles.pretty,
					pretty: doujin.titles.pretty || doujin.titles.english,
				},
				original: {
					full: doujin.titles.japanese || doujin.titles.english,
					pretty: doujin.titles.japanese || doujin.titles.pretty,
				},
			},
			details: {
				parodies: mapTags(doujin.tags.parodies),
				characters: mapTags(doujin.tags.characters),
				tags: mapTags(doujin.tags.tags),
				artists: mapTags(doujin.tags.artists),
				groups: mapTags(doujin.tags.groups),
				languages: mapTags(doujin.tags.languages),
				categories: mapTags(doujin.tags.categories),
				pages: doujin.length,
				uploaded: {
					datetime: doujin.uploadDate,
					pretty: doujin.uploadDate.toLocaleString(),
				},
			},
		}
	}
}
