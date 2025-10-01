import { EventEmitter } from 'node:events'
import http from 'node:http'
import https from 'node:https'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { processMarkdown } from '../lib/process-markdown.js'

const mockTitles: Record<string, string> = {
	'https://example.com': 'Example Domain',
	'https://nodejs.org': 'Node.js — Run JavaScript Everywhere',
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

describe('obsidian-syntax', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(https.get).mockImplementation(mockHttpGet as any)
		vi.mocked(http.get).mockImplementation(mockHttpGet as any)
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	describe('internal Links (Wikilinks)', () => {
		it('should preserve basic wikilinks', async () => {
			const markdown = `[[Page Name]]`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('[[Page Name]]')
			expect(content).not.toContain('\\[\\[')
		})

		it('should preserve wikilinks with aliases', async () => {
			const markdown = `[[Page Name|Display Text]]`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('[[Page Name|Display Text]]')
		})

		it('should preserve wikilinks to headings', async () => {
			const markdown = `[[Page Name#Section]]`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('[[Page Name#Section]]')
		})

		it('should preserve wikilinks to blocks', async () => {
			const markdown = `[[Page Name#^block-id]]`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('[[Page Name#^block-id]]')
		})

		it('should preserve block references in embeds', async () => {
			const markdown = `![[Note#^important-block]]`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('![[Note#^important-block]]')
		})
	})

	describe('block IDs', () => {
		it('should preserve standalone block ID definitions', async () => {
			const markdown = `This is a paragraph with a block ID. ^my-block-id

Another paragraph.`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('^my-block-id')
		})

		it('should preserve block IDs in complex content', async () => {
			const markdown = `# Heading

Some important text here. ^key-point

More text below.`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('^key-point')
		})
	})

	describe('embedded Files', () => {
		it('should preserve embedded images', async () => {
			const markdown = `![[image.png]]`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('![[image.png]]')
			expect(content).not.toContain('\\[\\[')
		})

		it('should preserve embedded images with size', async () => {
			const markdown = `![[image.png|100]]`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('![[image.png|100]]')
		})

		it('should preserve embedded images with width and height', async () => {
			const markdown = `![[image.png|100x200]]`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('![[image.png|100x200]]')
		})

		it('should preserve embedded notes', async () => {
			const markdown = `![[Other Note]]`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('![[Other Note]]')
		})

		it('should preserve embedded PDFs', async () => {
			const markdown = `![[document.pdf]]`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('![[document.pdf]]')
		})

		it('should preserve embedded audio/video', async () => {
			const markdown = `![[audio.mp3]]
![[video.mp4]]`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('![[audio.mp3]]')
			expect(content).toContain('![[video.mp4]]')
		})
	})

	describe('tags', () => {
		it('should preserve inline tags', async () => {
			const markdown = `This is a note with #tag and #another-tag`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('#tag')
			expect(content).toContain('#another-tag')
		})

		it('should preserve nested tags', async () => {
			const markdown = `#parent/child/grandchild`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('#parent/child/grandchild')
		})
	})

	describe('callouts', () => {
		it('should preserve basic callouts', async () => {
			const markdown = `> [!note]
> This is a callout`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('[!note]')
			expect(content).toContain('This is a callout')
		})

		it('should preserve callouts with titles', async () => {
			const markdown = `> [!warning] Important Warning
> Be careful!`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('[!warning] Important Warning')
			expect(content).toContain('Be careful!')
		})

		it('should preserve foldable callouts', async () => {
			const markdown = `> [!info]- Collapsible
> Hidden content`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('[!info]- Collapsible')
		})
	})

	describe('code Blocks', () => {
		it('should preserve code blocks with language', async () => {
			const markdown = `\`\`\`javascript
console.log('hello');
\`\`\``
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('```javascript')
			expect(content).toContain('console.log(\'hello\');')
		})

		it('should preserve inline code', async () => {
			const markdown = `This is \`inline code\` in text`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('`inline code`')
		})
	})

	describe('tables', () => {
		it('should preserve tables', async () => {
			const markdown = `| Header 1 | Header 2 |
| --- | --- |
| Cell 1 | Cell 2 |
| Cell 3 | Cell 4 |`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('Header 1')
			expect(content).toContain('Header 2')
			expect(content).toContain('Cell 1')
			expect(content).toContain('Cell 4')
		})

		it('should preserve table alignment', async () => {
			const markdown = `| Left | Center | Right |
| :--- | :---: | ---: |
| L | C | R |`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('Left')
			expect(content).toContain('Center')
			expect(content).toContain('Right')
		})

		it('should preserve tables without outer pipes', async () => {
			const markdown = `First name | Last name
-- | --
Max | Planck
Marie | Curie`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('First name')
			expect(content).toContain('Last name')
			expect(content).toContain('Max')
			expect(content).toContain('Curie')
		})

		it('should preserve internal links in tables', async () => {
			const markdown = `| First column | Second column |
| --- | --- |
| [[Internal Link]] | Content |`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('[[Internal Link]]')
		})

		it('should preserve embedded images in tables', async () => {
			const markdown = `| First column | Second column |
| --- | --- |
| Text | ![[image.jpg]] |`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('![[image.jpg]]')
		})

		it('should preserve escaped pipes in tables', async () => {
			const markdown = `| First column | Second column |
| --- | --- |
| [[Link\\|Alias]] | ![[image.jpg\\|200]] |`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('[[Link')
			expect(content).toContain('![[image.jpg')
		})
	})

	describe('task Lists', () => {
		it('should preserve unchecked tasks', async () => {
			const markdown = `- [ ] Unchecked task`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('- [ ] Unchecked task')
		})

		it('should preserve checked tasks', async () => {
			const markdown = `- [x] Checked task`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('- [x] Checked task')
		})

		it('should preserve mixed task lists', async () => {
			const markdown = `- [x] Done
- [ ] Todo
- [x] Also done`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('- [x] Done')
			expect(content).toContain('- [ ] Todo')
			expect(content).toContain('- [x] Also done')
		})
	})

	describe('footnotes', () => {
		it('should preserve footnotes', async () => {
			const markdown = `Here is a footnote[^1].

[^1]: This is the footnote content.`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('[^1]')
		})
	})

	describe('math (LaTeX)', () => {
		it('should preserve inline math', async () => {
			const markdown = `This is inline math $x^2 + y^2 = z^2$`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('$x^2 + y^2 = z^2$')
		})

		it('should preserve inline math with complex expressions', async () => {
			const markdown = `This is an inline math expression $e^{2i\\pi} = 1$.`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('$e^{2i\\pi} = 1$')
		})

		it('should preserve block math', async () => {
			const markdown = `$$
\\begin{equation}
x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}
\\end{equation}
$$`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('$$')
			expect(content).toContain('\\frac')
		})

		it('should preserve MathJax matrices', async () => {
			const markdown = `$$
\\begin{vmatrix}a & b\\\\c & d\\end{vmatrix}=ad-bc
$$`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('$$')
			expect(content).toContain('\\begin{vmatrix}')
			expect(content).toContain('\\end{vmatrix}')
		})
	})

	describe('diagrams (Mermaid)', () => {
		it('should preserve mermaid sequence diagrams', async () => {
			const markdown = `\`\`\`mermaid
sequenceDiagram
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!
\`\`\``
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('```mermaid')
			expect(content).toContain('sequenceDiagram')
			expect(content).toContain('Alice->>John')
		})

		it('should preserve mermaid graph diagrams', async () => {
			const markdown = `\`\`\`mermaid
graph TD
Biology --> Chemistry
\`\`\``
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('```mermaid')
			expect(content).toContain('graph TD')
			expect(content).toContain('Biology --> Chemistry')
		})

		it('should preserve mermaid diagrams with internal links', async () => {
			const markdown = `\`\`\`mermaid
graph TD
Biology --> Chemistry
class Biology,Chemistry internal-link;
\`\`\``
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('```mermaid')
			expect(content).toContain('class Biology,Chemistry internal-link')
		})

		it('should preserve mermaid diagrams with special characters', async () => {
			const markdown = `\`\`\`mermaid
graph TD
A["⨳ special character"]
class "⨳ special character" internal-link
\`\`\``
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('```mermaid')
			expect(content).toContain('⨳ special character')
		})
	})

	describe('comments', () => {
		it('should preserve HTML comments', async () => {
			const markdown = `This is visible
<!-- This is a comment -->
This is also visible`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('<!-- This is a comment -->')
		})

		it('should preserve percent comments', async () => {
			const markdown = `This is visible
%% This is an Obsidian comment %%
This is also visible`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('%% This is an Obsidian comment %%')
		})
	})

	describe('highlights', () => {
		it('should preserve highlights', async () => {
			const markdown = `This is ==highlighted text==`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('==highlighted text==')
		})
	})

	describe('strikethrough', () => {
		it('should preserve strikethrough', async () => {
			const markdown = `This is ~~deleted text~~`
			const { content } = await processMarkdown(markdown)
			expect(content).toContain('~~deleted text~~')
		})
	})

	describe('complex Mixed Content', () => {
		it('should handle document with multiple Obsidian features', async () => {
			const markdown = `---
title: Test Note
tags: [test, obsidian]
---

# Heading with #inline-tag

This is a paragraph with [https://example.com](https://example.com) and [[Internal Link]].

![[embedded-image.png|300]]

- [x] Completed task
- [ ] Pending task

> [!info] Callout
> With some content

\`\`\`javascript
const x = 10;
\`\`\`

This is ==highlighted== and ~~strikethrough~~.

Here's inline math $x^2$ and a footnote[^1].

[^1]: Footnote text.

%% This is a comment %%
`
			const { content } = await processMarkdown(markdown)

			expect(content).toContain('---')
			expect(content).toContain('title: Test Note')
			expect(content).toContain('#inline-tag')
			expect(content).toContain('[Example Domain](https://example.com)')
			expect(content).toContain('[[Internal Link]]')
			expect(content).toContain('![[embedded-image.png|300]]')
			expect(content).toContain('- [x] Completed task')
			expect(content).toContain('- [ ] Pending task')
			expect(content).toContain('[!info] Callout')
			expect(content).toContain('```javascript')
			expect(content).toContain('==highlighted==')
			expect(content).toContain('~~strikethrough~~')
			expect(content).toContain('$x^2$')
			expect(content).toContain('[^1]')
			expect(content).toContain('%% This is a comment %%')
		})

		it('should not convert URLs in code blocks', async () => {
			const markdown = `\`\`\`
[https://example.com](https://example.com)
\`\`\``
			const { content, changes } = await processMarkdown(markdown)
			expect(changes).toHaveLength(0)
			expect(content).toContain('[https://example.com](https://example.com)')
		})

		it('should not convert URLs in inline code', async () => {
			const markdown = `Check out \`[https://example.com](https://example.com)\` for info`
			const { changes } = await processMarkdown(markdown)
			expect(changes).toHaveLength(0)
		})
	})
})
