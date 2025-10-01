import { EventEmitter } from 'node:events'
import http from 'node:http'
import https from 'node:https'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearTitleCache, fetchTitle } from '../lib/fetch-title.js'

vi.mock('node:https', () => ({
	default: {
		get: vi.fn(),
	},
}))

vi.mock('node:http', () => ({
	default: {
		get: vi.fn(),
	},
}))

function createMockResponse(html: string, statusCode = 200) {
	const response = new EventEmitter()
	Object.assign(response, {
		statusCode,
		setEncoding: vi.fn(),
		destroy: vi.fn(),
	})

	setTimeout(() => {
		response.emit('data', html)
		response.emit('end')
	}, 0)

	return response
}

describe('fetch-title', () => {
	beforeEach(() => {
		clearTitleCache()
		vi.clearAllMocks()
	})

	afterEach(() => {
		clearTitleCache()
	})

	describe('fetchTitle', () => {
		it('should fetch and return title from HTML', async () => {
			const mockHtml = '<html><head><title>Test Title</title></head><body></body></html>'

			vi.mocked(https.get).mockImplementation((_url: any, _options: any, callback: any) => {
				callback(createMockResponse(mockHtml))
				return {
					on: vi.fn(),
					destroy: vi.fn(),
				} as any
			})

			const title = await fetchTitle('https://example.com')
			expect(title).toBe('Test Title')
		})

		it('should handle HTTP URLs', async () => {
			const mockHtml = '<html><head><title>HTTP Title</title></head><body></body></html>'

			vi.mocked(http.get).mockImplementation((_url: any, _options: any, callback: any) => {
				callback(createMockResponse(mockHtml))
				return {
					on: vi.fn(),
					destroy: vi.fn(),
				} as any
			})

			const title = await fetchTitle('http://example.com')
			expect(title).toBe('HTTP Title')
		})

		it('should trim whitespace from title', async () => {
			const mockHtml = '<html><head><title>  Title with spaces  </title></head><body></body></html>'

			vi.mocked(https.get).mockImplementation((_url: any, _options: any, callback: any) => {
				callback(createMockResponse(mockHtml))
				return {
					on: vi.fn(),
					destroy: vi.fn(),
				} as any
			})

			const title = await fetchTitle('https://example.com')
			expect(title).toBe('Title with spaces')
		})

		it('should handle title in chunks', async () => {
			vi.mocked(https.get).mockImplementation((_url: any, _options: any, callback: any) => {
				const response = new EventEmitter()
				Object.assign(response, {
					statusCode: 200,
					setEncoding: vi.fn(),
					destroy: vi.fn(),
				})

				setTimeout(() => {
					response.emit('data', '<html><head><ti')
					response.emit('data', 'tle>Chunked Title</ti')
					response.emit('data', 'tle></head></html>')
					response.emit('end')
				}, 0)

				callback(response)
				return {
					on: vi.fn(),
					destroy: vi.fn(),
				} as any
			})

			const title = await fetchTitle('https://example.com')
			expect(title).toBe('Chunked Title')
		})

		it('should return null when no title tag is found', async () => {
			const mockHtml = '<html><head></head><body>No title here</body></html>'

			vi.mocked(https.get).mockImplementation((_url: any, _options: any, callback: any) => {
				callback(createMockResponse(mockHtml))
				return {
					on: vi.fn(),
					destroy: vi.fn(),
				} as any
			})

			const title = await fetchTitle('https://example.com')
			expect(title).toBeNull()
		})

		it('should return null for non-2xx status codes', async () => {
			vi.mocked(https.get).mockImplementation((_url: any, _options: any, callback: any) => {
				callback(createMockResponse('<html><title>Error</title></html>', 404))
				return {
					on: vi.fn(),
					destroy: vi.fn(),
				} as any
			})

			const title = await fetchTitle('https://example.com')
			expect(title).toBeNull()
		})

		it('should return null for 500 status codes', async () => {
			vi.mocked(https.get).mockImplementation((_url: any, _options: any, callback: any) => {
				callback(createMockResponse('<html><title>Error</title></html>', 500))
				return {
					on: vi.fn(),
					destroy: vi.fn(),
				} as any
			})

			const title = await fetchTitle('https://example.com')
			expect(title).toBeNull()
		})

		it('should return null on network error', async () => {
			vi.mocked(https.get).mockImplementation((_url: any, _options: any, _callback: any) => {
				const request = new EventEmitter()
				setTimeout(() => {
					request.emit('error', new Error('Network error'))
				}, 0)
				return request as any
			})

			const title = await fetchTitle('https://example.com')
			expect(title).toBeNull()
		})

		it('should return null on timeout', async () => {
			vi.mocked(https.get).mockImplementation((_url: any, _options: any, _callback: any) => {
				const request = new EventEmitter()
				Object.assign(request, {
					destroy: vi.fn(),
				})
				setTimeout(() => {
					request.emit('timeout')
				}, 0)
				return request as any
			})

			const title = await fetchTitle('https://example.com')
			expect(title).toBeNull()
		})

		it('should return null for invalid URL', async () => {
			const title = await fetchTitle('not a url')
			expect(title).toBeNull()
		})

		it('should cache titles', async () => {
			const mockHtml = '<html><head><title>Cached Title</title></head><body></body></html>'

			vi.mocked(https.get).mockImplementation((_url: any, _options: any, callback: any) => {
				callback(createMockResponse(mockHtml))
				return {
					on: vi.fn(),
					destroy: vi.fn(),
				} as any
			})

			const title1 = await fetchTitle('https://example.com')
			const title2 = await fetchTitle('https://example.com')

			expect(title1).toBe('Cached Title')
			expect(title2).toBe('Cached Title')
			expect(https.get).toHaveBeenCalledTimes(1)
		})

		it('should use custom timeout', async () => {
			const mockHtml = '<html><head><title>Test</title></head><body></body></html>'

			vi.mocked(https.get).mockImplementation((_url: any, options: any, callback: any) => {
				expect(options.timeout).toBe(5000)
				callback(createMockResponse(mockHtml))
				return {
					on: vi.fn(),
					destroy: vi.fn(),
				} as any
			})

			await fetchTitle('https://example.com', 5000)
			expect(https.get).toHaveBeenCalled()
		})

		it('should handle title with special characters', async () => {
			const mockHtml = '<html><head><title>Title with &amp; &quot; \' characters</title></head><body></body></html>'

			vi.mocked(https.get).mockImplementation((_url: any, _options: any, callback: any) => {
				callback(createMockResponse(mockHtml))
				return {
					on: vi.fn(),
					destroy: vi.fn(),
				} as any
			})

			const title = await fetchTitle('https://example.com')
			expect(title).toBe('Title with &amp; &quot; \' characters')
		})

		it('should handle title with newlines and tabs', async () => {
			const mockHtml = '<html><head><title>\n\tTitle\n\twith\n\twhitespace\n</title></head></html>'

			vi.mocked(https.get).mockImplementation((_url: any, _options: any, callback: any) => {
				callback(createMockResponse(mockHtml))
				return {
					on: vi.fn(),
					destroy: vi.fn(),
				} as any
			})

			const title = await fetchTitle('https://example.com')
			expect(title).toBeTruthy()
		})

		it('should handle title tags with attributes', async () => {
			const mockHtml = '<html><head><title lang="en">Title with Attributes</title></head></html>'

			vi.mocked(https.get).mockImplementation((_url: any, _options: any, callback: any) => {
				callback(createMockResponse(mockHtml))
				return {
					on: vi.fn(),
					destroy: vi.fn(),
				} as any
			})

			const title = await fetchTitle('https://example.com')
			expect(title).toBe('Title with Attributes')
		})

		it('should follow redirects (301)', async () => {
			const finalHtml = '<html><head><title>Redirected Page</title></head></html>'

			vi.mocked(https.get).mockImplementation((url: any, _options: any, callback: any) => {
				if (url === 'https://example.com/old') {
					const redirectResponse = new EventEmitter()
					Object.assign(redirectResponse, {
						statusCode: 301,
						headers: { location: 'https://example.com/new' },
						destroy: vi.fn(),
					})
					setTimeout(() => callback(redirectResponse), 0)
				}
				else if (url === 'https://example.com/new') {
					callback(createMockResponse(finalHtml))
				}
				return {
					on: vi.fn(),
					destroy: vi.fn(),
				} as any
			})

			const title = await fetchTitle('https://example.com/old')
			expect(title).toBe('Redirected Page')
		})

		it('should follow redirects (302)', async () => {
			const finalHtml = '<html><head><title>Temporary Redirect</title></head></html>'

			vi.mocked(https.get).mockImplementation((url: any, _options: any, callback: any) => {
				if (url === 'https://example.com/temp') {
					const redirectResponse = new EventEmitter()
					Object.assign(redirectResponse, {
						statusCode: 302,
						headers: { location: 'https://example.com/final' },
						destroy: vi.fn(),
					})
					setTimeout(() => callback(redirectResponse), 0)
				}
				else if (url === 'https://example.com/final') {
					callback(createMockResponse(finalHtml))
				}
				return {
					on: vi.fn(),
					destroy: vi.fn(),
				} as any
			})

			const title = await fetchTitle('https://example.com/temp')
			expect(title).toBe('Temporary Redirect')
		})

		it('should handle relative redirect URLs', async () => {
			const finalHtml = '<html><head><title>Relative Redirect</title></head></html>'

			vi.mocked(https.get).mockImplementation((url: any, _options: any, callback: any) => {
				if (url === 'https://example.com/path') {
					const redirectResponse = new EventEmitter()
					Object.assign(redirectResponse, {
						statusCode: 301,
						headers: { location: '/newpath' },
						destroy: vi.fn(),
					})
					setTimeout(() => callback(redirectResponse), 0)
				}
				else if (url === 'https://example.com/newpath') {
					callback(createMockResponse(finalHtml))
				}
				return {
					on: vi.fn(),
					destroy: vi.fn(),
				} as any
			})

			const title = await fetchTitle('https://example.com/path')
			expect(title).toBe('Relative Redirect')
		})

		it('should stop after max redirects', async () => {
			vi.mocked(https.get).mockImplementation((_url: any, _options: any, callback: any) => {
				const redirectResponse = new EventEmitter()
				Object.assign(redirectResponse, {
					statusCode: 301,
					headers: { location: 'https://example.com/loop' },
					destroy: vi.fn(),
				})
				setTimeout(() => callback(redirectResponse), 0)
				return {
					on: vi.fn(),
					destroy: vi.fn(),
				} as any
			})

			const title = await fetchTitle('https://example.com/loop')
			expect(title).toBeNull()
		})

		it('should return null for redirect without location header', async () => {
			vi.mocked(https.get).mockImplementation((_url: any, _options: any, callback: any) => {
				const redirectResponse = new EventEmitter()
				Object.assign(redirectResponse, {
					statusCode: 301,
					headers: {},
					destroy: vi.fn(),
				})
				setTimeout(() => callback(redirectResponse), 0)
				return {
					on: vi.fn(),
					destroy: vi.fn(),
				} as any
			})

			const title = await fetchTitle('https://example.com')
			expect(title).toBeNull()
		})
	})

	describe('clearTitleCache', () => {
		it('should clear the cache', async () => {
			const mockHtml = '<html><head><title>Cached Title</title></head><body></body></html>'

			vi.mocked(https.get).mockImplementation((_url: any, _options: any, callback: any) => {
				callback(createMockResponse(mockHtml))
				return {
					on: vi.fn(),
					destroy: vi.fn(),
				} as any
			})

			await fetchTitle('https://example.com')
			clearTitleCache()
			await fetchTitle('https://example.com')

			expect(https.get).toHaveBeenCalledTimes(2)
		})
	})
})
