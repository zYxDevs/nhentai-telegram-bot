import path from 'node:path'
import AdmZip from 'adm-zip'
import { Composer, InputFile } from 'grammy'
import got from 'got'
import Werror from '../../lib/error.js'
import HentaiAPI from '../../sources/index.js'

const composer = new Composer()

composer.command('zip', async (ctx) => {
	const id = ctx.msg.text.split(' ')[1]?.trim()
	if (!id || !/^\d+$/.test(id)) {
		await ctx.reply('Usage: /zip <id>')
		return
	}

	const hentaiAPI = new HentaiAPI()

	let doujin
	try {
		doujin = await hentaiAPI.doujin(id)
	} catch (err) {
		await ctx.reply('Could not load doujin for ZIP')
		throw new Werror(err, 'Fetching doujin for zip')
	}

	if (doujin.pages.length === 0) {
		await ctx.reply('No pages found for this doujin')
		return
	}

	await ctx.replyWithChatAction('upload_document')

	const archive = new AdmZip()
	let skippedPages = 0

	for (const [index, pageUrl] of doujin.pages.entries()) {
		try {
			const image = await got(pageUrl).buffer()
			const extension = getExtensionFromUrl(pageUrl)
			const fileName = `${String(index + 1).padStart(3, '0')}.${extension}`

			archive.addFile(fileName, image)
		} catch {
			skippedPages += 1
		}
	}

	const addedEntries = archive.getEntries().length
	if (addedEntries === 0) {
		await ctx.reply('Failed to build ZIP archive')
		return
	}

	const zipBuffer = archive.toBuffer()
	const fileName = `${doujin.id}.zip`

	await ctx.replyWithDocument(new InputFile(zipBuffer, fileName), {
		caption: skippedPages > 0
			? `Downloaded ${addedEntries}/${doujin.pages.length} pages`
			: `Downloaded ${addedEntries} pages`,
	})
})

function getExtensionFromUrl(pageUrl: string) {
	const pathname = new URL(pageUrl).pathname
	const extension = path.extname(pathname).toLowerCase().slice(1)

	if (extension === 'jpg' || extension === 'jpeg' || extension === 'png' || extension === 'gif' || extension === 'webp') {
		return extension
	}

	return 'jpg'
}

export default composer
