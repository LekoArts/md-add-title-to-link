import http from 'node:http'
import https from 'node:https'

const titleCache = new Map<string, string>()

/**
 * Fetches the title of a webpage from its HTML <title> tag.
 * Results are cached to avoid redundant network requests.
 *
 * @example
 * const title = await fetchTitle('https://example.com')
 * console.log(title) // "Example Domain"
 *
 * @example
 * const title = await fetchTitle('https://example.com', 5000, 3)
 * console.log(title) // "Example Domain" with 5s timeout and max 3 redirects
 */
export async function fetchTitle(url: string, timeout = 10000, maxRedirects = 5): Promise<string | null> {
	if (titleCache.has(url)) {
		return titleCache.get(url)!
	}

	return fetchTitleInternal(url, timeout, maxRedirects)
}

async function fetchTitleInternal(url: string, timeout: number, redirectsLeft: number): Promise<string | null> {
	return new Promise((resolve) => {
		try {
			const urlObj = new URL(url)
			const client = urlObj.protocol === 'https:' ? https : http

			const options = {
				timeout,
				headers: {
					'User-Agent': 'Mozilla/5.0 (compatible; md-add-title-to-link/1.0; +https://github.com/LekoArts/md-add-title-to-link)',
				},
			}

			const req = client.get(url, options, (res) => {
				if (res.statusCode && res.statusCode >= 100 && res.statusCode < 200) {
					return
				}

				if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400) {
					res.destroy()
					const location = res.headers.location
					if (location && redirectsLeft > 0) {
						const redirectUrl = new URL(location, url).toString()
						resolve(fetchTitleInternal(redirectUrl, timeout, redirectsLeft - 1))
					}
					else {
						resolve(null)
					}
					return
				}

				if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 400)) {
					res.destroy()
					resolve(null)
					return
				}

				let html = ''
				res.setEncoding('utf8')

				res.on('data', (chunk) => {
					html += chunk
					const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
					if (titleMatch) {
						const title = titleMatch[1].trim()
						titleCache.set(url, title)
						res.destroy()
						resolve(title)
					}
				})

				res.on('end', () => {
					const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
					if (titleMatch) {
						const title = titleMatch[1].trim()
						titleCache.set(url, title)
						resolve(title)
					}
					else {
						resolve(null)
					}
				})
			})

			req.on('error', () => {
				resolve(null)
			})

			req.on('timeout', () => {
				req.destroy()
				resolve(null)
			})
		}
		catch {
			resolve(null)
		}
	})
}

/**
 * Clears the title cache, forcing fresh fetches for all URLs.
 *
 * @example
 * clearTitleCache()
 */
export function clearTitleCache(): void {
	titleCache.clear()
}
