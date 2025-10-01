/**
 * Checks if a string is a valid HTTP or HTTPS URL.
 *
 * @example
 * isUrl('https://example.com') // true
 *
 * @example
 * isUrl('not a url') // false
 */
export function isUrl(text: string): boolean {
	try {
		const url = new URL(text)
		return url.protocol === 'http:' || url.protocol === 'https:'
	}
	catch {
		return false
	}
}
