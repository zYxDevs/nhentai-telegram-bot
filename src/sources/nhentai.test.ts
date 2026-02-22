import test from 'ava'
import NHentai from './nhentai.js'

test('nhentai get doujin', async (t) => {
	const c = new NHentai()
	const doujin = await c.doujin('334430')

	console.log(doujin)
	console.log(doujin.details)

	t.is(doujin.id, '334430')
	t.assert(doujin.title.translated.pretty.length > 0)
	t.assert(doujin.pages.length > 0)
	t.assert(doujin.thumbnail.length > 0)
	t.assert(doujin.details.pages > 0)
})

test('nhentai search', async (t) => {
	const c = new NHentai()
	const result = await c.search('elf', 1)

	console.log(result)

	t.assert(result.results.length > 0)
	t.assert(result.total > 0)
	const first = result.results[0]!
	t.assert(first.id.length > 0)
	t.assert(first.thumbnail.length > 0)
})

// Note: random may fail due to Cloudflare challenges on nhentai.net
// The nhentai library recommends using FlareSolverr for this
test.skip('nhentai random', async (t) => {
	const c = new NHentai()
	const doujin = await c.random()

	console.log(doujin)

	t.assert(doujin.id.length > 0)
	t.assert(doujin.pages.length > 0)
	t.assert(doujin.thumbnail.length > 0)
})
