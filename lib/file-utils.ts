import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Recursively finds all markdown files (.md) in a directory.
 *
 * @example
 * const files = await findMarkdownFiles('/path/to/docs')
 * console.log(files) // ['/path/to/docs/README.md', '/path/to/docs/guide/intro.md']
 */
export async function findMarkdownFiles(dir: string): Promise<string[]> {
	const files: string[] = []

	async function scan(currentDir: string) {
		const entries = await readdir(currentDir, { withFileTypes: true })

		for (const entry of entries) {
			const fullPath = join(currentDir, entry.name)
			if (entry.isDirectory()) {
				await scan(fullPath)
			}
			else if (entry.isFile() && entry.name.endsWith('.md')) {
				files.push(fullPath)
			}
		}
	}

	await scan(dir)
	return files
}
