import { readFile, writeFile } from 'node:fs/promises'
import { parse } from '@bomb.sh/args'
import { findMarkdownFiles } from './lib/file-utils.js'
import { processMarkdown } from './lib/process-markdown.js'

const argv = process.argv.slice(2)
const args = parse(argv, {
	default: {
		'dry-run': false,
		'verbose': false,
	},
	boolean: ['dry-run', 'verbose'],
})

/**
 * Main function that processes markdown files and replaces bare URL links with their page titles.
 *
 * @example
 * pnpm start /path/to/markdown
 *
 * @example
 * pnpm start /path/to/markdown --dry-run --verbose
 */
async function main() {
	const targetPath = typeof args._[0] === 'string' ? args._[0] : String(args._[0])

	if (!targetPath || typeof args._[0] === 'boolean') {
		console.error('Error: Please provide a path to markdown files')
		console.error('Usage: pnpm start /absolute-path/to/md-files [--dry-run]')
		process.exit(1)
	}

	console.log(`Processing markdown files in: ${targetPath}`)
	if (args['dry-run']) {
		console.log('🔍 DRY RUN MODE - No files will be modified\n')
	}

	try {
		const files = await findMarkdownFiles(targetPath)
		console.log(`Found ${files.length} markdown file(s)\n`)

		for (const file of files) {
			console.log(`Processing: ${file}`)
			const content = await readFile(file, 'utf-8')
			const { content: newContent, changes } = await processMarkdown(content)

			if (changes.length > 0) {
				console.log(`  ✓ Found ${changes.length} link(s) to update`)
				if (args.verbose) {
					for (const change of changes) {
						console.log(`    "${change.from}" → "${change.to}"`)
					}
				}

				if (!args['dry-run']) {
					await writeFile(file, newContent, 'utf-8')
					console.log(`  ✓ File updated`)
				}
				else {
					console.log(`  ℹ Would update file (dry-run mode)`)
				}
			}
			else {
				console.log(`  - No links to update`)
			}
			console.log()
		}

		console.log('✓ Done!')
	}
	catch (error) {
		console.error('Error:', error instanceof Error ? error.message : error)
		process.exit(1)
	}
}

main()
