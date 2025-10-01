import { EventEmitter } from 'node:events'
import { readFile, writeFile } from 'node:fs/promises'
import http from 'node:http'
import https from 'node:https'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

const mockTitles: Record<string, string> = {
	'https://community.home-assistant.io/t/homekit-add-support-for-home-assistant-scenes/68924/14': 'HomeKit: Add support for Home Assistant scenes - Feature Requests - Home Assistant Community',
	'https://www.redhat.com/sysadmin/fzf-linux-fuzzy-finder': 'Find anything you need with fzf, the Linux fuzzy finder tool',
	'https://github.com/sindresorhus/trash-cli': 'GitHub - sindresorhus/trash-cli: Move files and folders to the trash',
	'https://github.com/zsh-users/zsh-syntax-highlighting/blob/master/INSTALL.md#oh-my-zsh': 'zsh-syntax-highlighting/INSTALL.md at master · zsh-users/zsh-syntax-highlighting · GitHub',
	'https://cwwk.net/products/cwwk-12th-gen-i3-n305-n100-2-intel-i226-v-2-5g-nas-motherboard-6-sata3-0-6-bay-soft-rout-1-ddr5-4800mhz-firewall-itx-mainboard': 'CWWK 12th Gen i3-N305 N100 2*Intel i226-V 2.5G NAS Motherboard 6*SATA3.0 6 Bay Soft Rout 1*DDR5 4800MHz Firewall ITX Mainboard',
	'https://www.toptonpc.com/product/topton-6-bay-i3-n305-nas-motherboard-1pciex4-2intel-i226-v/': 'Topton 6 Bay i3-N305 NAS Motherboard 1*PCIE*4 2*Intel i226-V – TOPTON PC',
	'https://nodejs.org': 'Node.js — Run JavaScript Everywhere',
	'https://www.typescriptlang.org': 'TypeScript: JavaScript With Syntax For Types',
	'https://github.com/vitest-dev/vitest': 'GitHub - vitest-dev/vitest: Next generation testing framework powered by Vite',
	'https://deno.land': 'Deno — A modern runtime for JavaScript and TypeScript',
	'https://bun.sh': 'Bun — A fast all-in-one JavaScript runtime',
	'https://developer.mozilla.org/en-US/': 'MDN Web Docs',
	'https://www.markdownguide.org': 'Markdown Guide',
}

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

function createMockResponse(html: string) {
	const response = new EventEmitter()
	Object.assign(response, {
		statusCode: 200,
		setEncoding: vi.fn(),
		destroy: vi.fn(),
	})

	setTimeout(() => {
		response.emit('data', html)
		response.emit('end')
	}, 0)

	return response
}

function mockHttpGet(url: string, _options: any, callback: any) {
	const title = mockTitles[url]
	const html = title ? `<html><head><title>${title}</title></head><body></body></html>` : '<html></html>'

	const response = createMockResponse(html)
	callback(response)

	return {
		on: vi.fn(),
		destroy: vi.fn(),
	}
}

describe('md-add-title-to-link', () => {
	it('should convert URL links to titled links', async () => {
		vi.mocked(https.get).mockImplementation(mockHttpGet as any)
		vi.mocked(http.get).mockImplementation(mockHttpGet as any)

		const inputPath = join(process.cwd(), 'test/fixtures/input.md')
		const outputPath = join(process.cwd(), 'test/fixtures/output.md')

		const inputContent = await readFile(inputPath, 'utf-8')

		const { processMarkdown } = await import('../lib/process-markdown.js')
		const { content: outputContent } = await processMarkdown(inputContent)

		await writeFile(outputPath, outputContent, 'utf-8')

		expect(outputContent).toContain('[HomeKit: Add support for Home Assistant scenes - Feature Requests - Home Assistant Community]')
		expect(outputContent).toContain('[Find anything you need with fzf, the Linux fuzzy finder tool]')
		expect(outputContent).toContain('[GitHub - sindresorhus/trash-cli: Move files and folders to the trash]')
		expect(outputContent).toContain('[zsh-syntax-highlighting/INSTALL.md at master · zsh-users/zsh-syntax-highlighting · GitHub]')

		expect(outputContent).toContain('[Sellrainer Hüttenrunde in 5 Tagen]')

		expect(outputContent).toContain('[https://example.com](https://example.com "Example Domain")')

		expect(outputContent).toContain('[Markdown Guide](https://www.markdownguide.org)')

		expect(outputContent).toContain('**[Node.js — Run JavaScript Everywhere](https://nodejs.org)**')
		expect(outputContent).toContain('*[TypeScript: JavaScript With Syntax For Types](https://www.typescriptlang.org)*')

		expect(outputContent).toContain('> Some quote with link [GitHub - vitest-dev/vitest: Next generation testing framework powered by Vite](https://github.com/vitest-dev/vitest)')

		expect(outputContent).toContain('[Deno — A modern runtime for JavaScript and TypeScript](https://deno.land)')
		expect(outputContent).toContain('[Bun — A fast all-in-one JavaScript runtime](https://bun.sh)')

		expect(outputContent).toContain('[MDN Web Docs](https://developer.mozilla.org/en-US/)')

		expect(outputContent).toContain('[https://this-will-fail.example.test](https://this-will-fail.example.test)')

		expect(outputContent).not.toContain('<https://www.redhat.com')
	})

	it('should handle edge cases correctly', async () => {
		vi.mocked(https.get).mockImplementation(mockHttpGet as any)
		vi.mocked(http.get).mockImplementation(mockHttpGet as any)

		const { processMarkdown } = await import('../lib/process-markdown.js')

		const edgeCaseMarkdown = `
# Edge Cases

Link with existing title should NOT be converted:
[https://example.com](https://example.com "Keep this title")

Regular link with custom text should NOT be converted:
[Click here](https://example.com)

Empty document with just a link:
[https://nodejs.org](https://nodejs.org)

Link inside code block should NOT be processed (but this test just shows inline format):
\`\`\`
[https://example.com](https://example.com)
\`\`\`

Multiple links on same line: [https://deno.land](https://deno.land) and [https://bun.sh](https://bun.sh).
`

		const { content: output, changes } = await processMarkdown(edgeCaseMarkdown)

		expect(output).toContain('[https://example.com](https://example.com "Keep this title")')
		expect(output).toContain('[Click here](https://example.com)')
		expect(output).toContain('[Node.js — Run JavaScript Everywhere](https://nodejs.org)')
		expect(output).toContain('[Deno — A modern runtime for JavaScript and TypeScript](https://deno.land)')
		expect(output).toContain('[Bun — A fast all-in-one JavaScript runtime](https://bun.sh)')

		expect(changes).toHaveLength(3)
		expect(changes[0].from).toBe('https://nodejs.org')
		expect(changes[0].to).toBe('Node.js — Run JavaScript Everywhere')
	})

	it('should preserve YAML frontmatter', async () => {
		vi.mocked(https.get).mockImplementation(mockHttpGet as any)
		vi.mocked(http.get).mockImplementation(mockHttpGet as any)

		const { processMarkdown } = await import('../lib/process-markdown.js')

		const markdownWithFrontmatter = `---
title: Test Document
tags:
  - Tech
  - Programming
date: 2024-01-01
---

# Content

Check out [https://nodejs.org](https://nodejs.org) for more info.
`

		const { content: output } = await processMarkdown(markdownWithFrontmatter)

		expect(output).toContain('---')
		expect(output).toContain('title: Test Document')
		expect(output).toContain('tags:')
		expect(output).toContain('  - Tech')
		expect(output).toContain('  - Programming')
		expect(output).toContain('date: 2024-01-01')
		expect(output).toContain('---')
		expect(output).toContain('[Node.js — Run JavaScript Everywhere](https://nodejs.org)')
		expect(output).not.toContain('***')
	})

	it('should preserve Obsidian wiki-style image links', async () => {
		vi.mocked(https.get).mockImplementation(mockHttpGet as any)
		vi.mocked(http.get).mockImplementation(mockHttpGet as any)

		const { processMarkdown } = await import('../lib/process-markdown.js')

		const markdownWithWikiLinks = `# Document

Check out [https://nodejs.org](https://nodejs.org)

![[screenshot.png]]

![[folder/image-with-dashes.jpg]]

Some text here.
`

		const { content: output } = await processMarkdown(markdownWithWikiLinks)

		expect(output).toContain('![[screenshot.png]]')
		expect(output).toContain('![[folder/image-with-dashes.jpg]]')
		expect(output).not.toContain('\\[\\[')
		expect(output).not.toContain(']]\\]')
		expect(output).toContain('[Node.js — Run JavaScript Everywhere](https://nodejs.org)')
	})

	it('should handle frontmatter and wiki links together', async () => {
		vi.mocked(https.get).mockImplementation(mockHttpGet as any)
		vi.mocked(http.get).mockImplementation(mockHttpGet as any)

		const { processMarkdown } = await import('../lib/process-markdown.js')

		const complexMarkdown = `---
tags:
  - Tech
---

[https://nodejs.org](https://nodejs.org)

![[cinema-4d-layout.png]]

I, Robot (*ROBOTS*)
`

		const { content: output } = await processMarkdown(complexMarkdown)

		expect(output).toContain('---')
		expect(output).toContain('tags:')
		expect(output).toContain('  - Tech')
		expect(output).toContain('[Node.js — Run JavaScript Everywhere](https://nodejs.org)')
		expect(output).toContain('![[cinema-4d-layout.png]]')
		expect(output).toContain('I, Robot (*ROBOTS*)')
		expect(output).not.toContain('***')
		expect(output).not.toContain('\\[\\[')
	})
})
