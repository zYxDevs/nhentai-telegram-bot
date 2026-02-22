import test from 'ava'
import resolveSourceRequestOptions from './request-options.js'

function restoreEnv(name: string, value: string | undefined) {
	if (value === undefined) {
		delete process.env[name]
		return
	}

	process.env[name] = value
}

test('request options are optional by default', (t) => {
	const oldSourceFlareSolverr = process.env['SOURCE_FLARESOLVERR_URL']
	const oldFlareSolverr = process.env['FLARESOLVERR_URL']
	const oldSourceProxy = process.env['SOURCE_PROXY_URL']
	const oldSourceTimeout = process.env['SOURCE_MAX_TIMEOUT_MS']

	delete process.env['SOURCE_FLARESOLVERR_URL']
	delete process.env['FLARESOLVERR_URL']
	delete process.env['SOURCE_PROXY_URL']
	delete process.env['SOURCE_MAX_TIMEOUT_MS']

	const options = resolveSourceRequestOptions()

	t.is(options.flaresolverrUrl, undefined)
	t.is(options.flaresolverrProxyUrl, undefined)
	t.is(options.flaresolverrMaxTimeout, 60000)

	restoreEnv('SOURCE_FLARESOLVERR_URL', oldSourceFlareSolverr)
	restoreEnv('FLARESOLVERR_URL', oldFlareSolverr)
	restoreEnv('SOURCE_PROXY_URL', oldSourceProxy)
	restoreEnv('SOURCE_MAX_TIMEOUT_MS', oldSourceTimeout)
})

test('request options read env and allow overrides', (t) => {
	const oldSourceFlareSolverr = process.env['SOURCE_FLARESOLVERR_URL']
	const oldFlareSolverr = process.env['FLARESOLVERR_URL']
	const oldSourceProxy = process.env['SOURCE_PROXY_URL']
	const oldSourceTimeout = process.env['SOURCE_MAX_TIMEOUT_MS']

	process.env['SOURCE_FLARESOLVERR_URL'] = 'http://127.0.0.1:8191'
	process.env['FLARESOLVERR_URL'] = 'http://127.0.0.1:9999'
	process.env['SOURCE_PROXY_URL'] = 'http://127.0.0.1:8888'
	process.env['SOURCE_MAX_TIMEOUT_MS'] = '45000'

	const fromEnv = resolveSourceRequestOptions()

	t.is(fromEnv.flaresolverrUrl, 'http://127.0.0.1:8191/v1')
	t.is(fromEnv.flaresolverrProxyUrl, 'http://127.0.0.1:8888')
	t.is(fromEnv.flaresolverrMaxTimeout, 45000)

	const fromOverrides = resolveSourceRequestOptions({
		flaresolverrUrl: 'http://127.0.0.1:8192',
		flaresolverrProxyUrl: 'http://127.0.0.1:8899',
		flaresolverrMaxTimeout: 30000,
	})

	t.is(fromOverrides.flaresolverrUrl, 'http://127.0.0.1:8192/v1')
	t.is(fromOverrides.flaresolverrProxyUrl, 'http://127.0.0.1:8899')
	t.is(fromOverrides.flaresolverrMaxTimeout, 30000)

	restoreEnv('SOURCE_FLARESOLVERR_URL', oldSourceFlareSolverr)
	restoreEnv('FLARESOLVERR_URL', oldFlareSolverr)
	restoreEnv('SOURCE_PROXY_URL', oldSourceProxy)
	restoreEnv('SOURCE_MAX_TIMEOUT_MS', oldSourceTimeout)
})
