import { Source } from './index.js'
import eHentai from './ehentai.to.js'
import NHentai from './nhentai.js'

export default function chooseSource(source?: string): Source {
	switch (source) {
	case 'nhentai':
		return new NHentai()
	case 'ehentai':
	default:
		return new eHentai()
	}
}
