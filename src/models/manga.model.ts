export interface MangaI {
	id: string
	title: string
	description: string
	tags: string[]
	pages: number
	thumbnail: string
	previews: {
		telegraph_url: string
	}
	createdAt?: Date
	updatedAt?: Date
}

export type Manga = MangaI
