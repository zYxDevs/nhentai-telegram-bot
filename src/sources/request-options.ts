export interface SourceRequestOptions {
	flaresolverrUrl?: string
	flaresolverrProxyUrl?: string
	flaresolverrMaxTimeout: number
}

const defaultFlaresolverrMaxTimeout = 60_000

function normalizeFlareSolverrUrl(value?: string): string | undefined {
	if (!value) {
		return undefined
	}

	let parsed: URL
	try {
		parsed = new URL(value)
	} catch {
		return value
	}

	if (parsed.pathname === '/' || parsed.pathname === '') {
		parsed.pathname = '/v1'
	}

	return parsed.toString()
}

function parseTimeout(value?: string): number {
	if (!value) {
		return defaultFlaresolverrMaxTimeout
	}

	const parsed = Number.parseInt(value, 10)
	if (!Number.isFinite(parsed) || parsed <= 0) {
		return defaultFlaresolverrMaxTimeout
	}

	return parsed
}

export default function resolveSourceRequestOptions(
	overrides?: Partial<SourceRequestOptions>
): SourceRequestOptions {
	return {
		flaresolverrUrl:
			normalizeFlareSolverrUrl(overrides?.flaresolverrUrl)
			?? normalizeFlareSolverrUrl(process.env['SOURCE_FLARESOLVERR_URL'])
			?? normalizeFlareSolverrUrl(process.env['FLARESOLVERR_URL']),
		flaresolverrProxyUrl:
			overrides?.flaresolverrProxyUrl
			?? process.env['SOURCE_PROXY_URL'],
		flaresolverrMaxTimeout:
			overrides?.flaresolverrMaxTimeout
			?? parseTimeout(process.env['SOURCE_MAX_TIMEOUT_MS']),
	}
}
