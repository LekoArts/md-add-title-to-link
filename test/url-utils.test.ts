import { describe, expect, it } from 'vitest'
import { isUrl } from '../lib/url-utils.js'

describe('url-utils', () => {
	describe('isUrl', () => {
		it('should return true for valid HTTP URLs', () => {
			expect(isUrl('http://example.com')).toBe(true)
			expect(isUrl('http://example.com/')).toBe(true)
			expect(isUrl('http://example.com/path')).toBe(true)
			expect(isUrl('http://example.com/path/to/resource')).toBe(true)
		})

		it('should return true for valid HTTPS URLs', () => {
			expect(isUrl('https://example.com')).toBe(true)
			expect(isUrl('https://example.com/')).toBe(true)
			expect(isUrl('https://example.com/path')).toBe(true)
			expect(isUrl('https://www.example.com')).toBe(true)
		})

		it('should return true for URLs with query parameters', () => {
			expect(isUrl('https://example.com?foo=bar')).toBe(true)
			expect(isUrl('https://example.com?foo=bar&baz=qux')).toBe(true)
			expect(isUrl('https://example.com/path?query=value')).toBe(true)
		})

		it('should return true for URLs with fragments', () => {
			expect(isUrl('https://example.com#section')).toBe(true)
			expect(isUrl('https://example.com/path#anchor')).toBe(true)
			expect(isUrl('https://example.com?foo=bar#section')).toBe(true)
		})

		it('should return true for URLs with ports', () => {
			expect(isUrl('http://example.com:8080')).toBe(true)
			expect(isUrl('https://example.com:443')).toBe(true)
			expect(isUrl('http://localhost:3000')).toBe(true)
		})

		it('should return true for URLs with userinfo', () => {
			expect(isUrl('https://user@example.com')).toBe(true)
			expect(isUrl('https://user:pass@example.com')).toBe(true)
		})

		it('should return true for URLs with special characters in path', () => {
			expect(isUrl('https://example.com/path-with-dashes')).toBe(true)
			expect(isUrl('https://example.com/path_with_underscores')).toBe(true)
			expect(isUrl('https://example.com/path%20with%20spaces')).toBe(true)
		})

		it('should return true for complex real-world URLs', () => {
			expect(isUrl('https://github.com/sindresorhus/trash-cli')).toBe(true)
			expect(isUrl('https://www.alpenvereinaktiv.com/de/tour/sellrainer-huettenrunde-in-5-tagen/33003921/#caml=99c,1typm8,7sjywe,0,0&dmdtab=oax-tab3')).toBe(true)
			expect(isUrl('https://developer.mozilla.org/en-US/docs/Web/JavaScript')).toBe(true)
		})

		it('should return false for non-HTTP(S) protocols', () => {
			expect(isUrl('ftp://example.com')).toBe(false)
			expect(isUrl('file:///path/to/file')).toBe(false)
			expect(isUrl('mailto:test@example.com')).toBe(false)
			expect(isUrl('tel:+1234567890')).toBe(false)
			expect(isUrl('data:text/plain;base64,SGVsbG8=')).toBe(false)
		})

		it('should return false for invalid URLs', () => {
			expect(isUrl('not a url')).toBe(false)
			expect(isUrl('example.com')).toBe(false)
			expect(isUrl('www.example.com')).toBe(false)
			expect(isUrl('//example.com')).toBe(false)
			expect(isUrl('/path/to/resource')).toBe(false)
		})

		it('should return false for empty or whitespace strings', () => {
			expect(isUrl('')).toBe(false)
			expect(isUrl(' ')).toBe(false)
			expect(isUrl('   ')).toBe(false)
			expect(isUrl('\t')).toBe(false)
			expect(isUrl('\n')).toBe(false)
		})

		it('should return false for strings that look like URLs but are malformed', () => {
			expect(isUrl('http://')).toBe(false)
			expect(isUrl('https://')).toBe(false)
			expect(isUrl('http:///')).toBe(false)
			expect(isUrl('http:// example.com')).toBe(false)
		})

		it('should return false for special characters and symbols', () => {
			expect(isUrl('!@#$%^&*()')).toBe(false)
			expect(isUrl('<script>alert("xss")</script>')).toBe(false)
			expect(isUrl('[text](url)')).toBe(false)
		})

		it('should handle edge cases', () => {
			expect(isUrl('http://localhost')).toBe(true)
			expect(isUrl('http://127.0.0.1')).toBe(true)
			expect(isUrl('http://192.168.1.1')).toBe(true)
			expect(isUrl('https://example.com:65535')).toBe(true)
		})
	})
})
