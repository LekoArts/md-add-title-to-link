import type { Link } from 'mdast'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { fetchTitle } from './fetch-title.js'
import { isUrl } from './url-utils.js'

/**
 * Processes markdown content and replaces bare URL links with their page titles.
 * Only replaces links where the link text is the same as the URL itself.
 *
 * @example
 * const { content, changes } = await processMarkdown('[https://example.com](https://example.com)')
 * console.log(content) // '[Example Domain](https://example.com)'
 * console.log(changes) // [{ from: 'https://example.com', to: 'Example Domain', url: 'https://example.com' }]
 */
export async function processMarkdown(content: string): Promise<{ content: string, changes: Array<{ from: string, to: string, url: string }> }> {
	const changes: Array<{ from: string, to: string, url: string }> = []
	const urlsToFetch: Array<{ node: Link, url: string }> = []

	const tree = unified()
		.use(remarkParse)
		.use(remarkFrontmatter, ['yaml', 'toml'])
		.parse(content)

	visit(tree, 'link', (node: Link) => {
		const linkText = node.children[0]
		if (linkText && linkText.type === 'text' && isUrl(linkText.value) && linkText.value === node.url && !node.title) {
			urlsToFetch.push({ node, url: node.url })
		}
	})

	const fetchPromises = urlsToFetch.map(async ({ node, url }) => {
		const title = await fetchTitle(url)
		if (title) {
			const linkText = node.children[0]
			if (linkText && linkText.type === 'text') {
				changes.push({ from: linkText.value, to: title, url })
				linkText.value = title
			}
		}
	})

	await Promise.all(fetchPromises)

	let result = unified()
		.use(remarkFrontmatter, ['yaml', 'toml'])
		.use(remarkStringify, {
			bullet: '-',
			fences: true,
			incrementListMarker: false,
			resourceLink: true,
		})
		.stringify(tree)

	result = result
		.replace(/!\\\[\\\[([^\]]+)\]\]/g, '![[$1]]')
		.replace(/\\\[\\\[([^\]]+)\]\]/g, '[[$1]]')
		.replace(/\\\[ \]/g, '[ ]')
		.replace(/\\\[x\]/g, '[x]')
		.replace(/\\\[\^(\d+)\]/g, '[^$1]')
		.replace(/> \\\[(![\w-]+)\]/g, '> [$1]')
		.replace(/\\\[(![\w-][^\]]*)\]/, '[$1]')

	return { content: result, changes }
}
