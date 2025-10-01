import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { findMarkdownFiles } from '../lib/file-utils.js'

const TEST_DIR = join(process.cwd(), 'test-temp')

describe('file-utils', () => {
	beforeEach(async () => {
		await mkdir(TEST_DIR, { recursive: true })
	})

	afterEach(async () => {
		await rm(TEST_DIR, { recursive: true, force: true })
	})

	describe('findMarkdownFiles', () => {
		it('should find markdown files in a directory', async () => {
			await writeFile(join(TEST_DIR, 'file1.md'), '# Test')
			await writeFile(join(TEST_DIR, 'file2.md'), '# Test')
			await writeFile(join(TEST_DIR, 'file3.txt'), 'Not markdown')

			const files = await findMarkdownFiles(TEST_DIR)

			expect(files).toHaveLength(2)
			expect(files).toContain(join(TEST_DIR, 'file1.md'))
			expect(files).toContain(join(TEST_DIR, 'file2.md'))
			expect(files).not.toContain(join(TEST_DIR, 'file3.txt'))
		})

		it('should find markdown files recursively in subdirectories', async () => {
			const subDir1 = join(TEST_DIR, 'subdir1')
			const subDir2 = join(TEST_DIR, 'subdir2')
			const nestedDir = join(subDir1, 'nested')

			await mkdir(subDir1, { recursive: true })
			await mkdir(subDir2, { recursive: true })
			await mkdir(nestedDir, { recursive: true })

			await writeFile(join(TEST_DIR, 'root.md'), '# Root')
			await writeFile(join(subDir1, 'sub1.md'), '# Sub1')
			await writeFile(join(subDir2, 'sub2.md'), '# Sub2')
			await writeFile(join(nestedDir, 'nested.md'), '# Nested')

			const files = await findMarkdownFiles(TEST_DIR)

			expect(files).toHaveLength(4)
			expect(files).toContain(join(TEST_DIR, 'root.md'))
			expect(files).toContain(join(subDir1, 'sub1.md'))
			expect(files).toContain(join(subDir2, 'sub2.md'))
			expect(files).toContain(join(nestedDir, 'nested.md'))
		})

		it('should return empty array for directory with no markdown files', async () => {
			await writeFile(join(TEST_DIR, 'file.txt'), 'Text file')
			await writeFile(join(TEST_DIR, 'file.js'), 'console.log("js")')
			await writeFile(join(TEST_DIR, 'file.html'), '<html></html>')

			const files = await findMarkdownFiles(TEST_DIR)

			expect(files).toHaveLength(0)
		})

		it('should return empty array for empty directory', async () => {
			const files = await findMarkdownFiles(TEST_DIR)

			expect(files).toHaveLength(0)
		})

		it('should only include files ending with .md extension', async () => {
			await writeFile(join(TEST_DIR, 'file.md'), '# Markdown')
			await writeFile(join(TEST_DIR, 'file.MD'), '# Uppercase')
			await writeFile(join(TEST_DIR, 'file.markdown'), '# Markdown alt')
			await writeFile(join(TEST_DIR, 'file.txt.md'), '# Double extension')
			await writeFile(join(TEST_DIR, 'file.md.txt'), 'Not markdown')

			const files = await findMarkdownFiles(TEST_DIR)

			expect(files).toContain(join(TEST_DIR, 'file.md'))
			expect(files).toContain(join(TEST_DIR, 'file.txt.md'))
			expect(files).not.toContain(join(TEST_DIR, 'file.MD'))
			expect(files).not.toContain(join(TEST_DIR, 'file.markdown'))
			expect(files).not.toContain(join(TEST_DIR, 'file.md.txt'))
		})

		it('should handle directories with special characters', async () => {
			const specialDir = join(TEST_DIR, 'special-dir_123')
			await mkdir(specialDir, { recursive: true })
			await writeFile(join(specialDir, 'file.md'), '# Test')

			const files = await findMarkdownFiles(TEST_DIR)

			expect(files).toHaveLength(1)
			expect(files).toContain(join(specialDir, 'file.md'))
		})

		it('should handle files with special characters in name', async () => {
			await writeFile(join(TEST_DIR, 'file-with-dashes.md'), '# Test')
			await writeFile(join(TEST_DIR, 'file_with_underscores.md'), '# Test')
			await writeFile(join(TEST_DIR, 'file with spaces.md'), '# Test')

			const files = await findMarkdownFiles(TEST_DIR)

			expect(files).toHaveLength(3)
			expect(files).toContain(join(TEST_DIR, 'file-with-dashes.md'))
			expect(files).toContain(join(TEST_DIR, 'file_with_underscores.md'))
			expect(files).toContain(join(TEST_DIR, 'file with spaces.md'))
		})

		it('should handle deeply nested directories', async () => {
			const deepPath = join(TEST_DIR, 'a', 'b', 'c', 'd', 'e')
			await mkdir(deepPath, { recursive: true })
			await writeFile(join(deepPath, 'deep.md'), '# Deep')

			const files = await findMarkdownFiles(TEST_DIR)

			expect(files).toHaveLength(1)
			expect(files).toContain(join(deepPath, 'deep.md'))
		})

		it('should handle multiple files in same directory', async () => {
			const fileCount = 10
			for (let i = 0; i < fileCount; i++) {
				await writeFile(join(TEST_DIR, `file${i}.md`), `# File ${i}`)
			}

			const files = await findMarkdownFiles(TEST_DIR)

			expect(files).toHaveLength(fileCount)
		})

		it('should skip hidden files and directories starting with dot', async () => {
			await writeFile(join(TEST_DIR, '.hidden.md'), '# Hidden')
			await writeFile(join(TEST_DIR, 'visible.md'), '# Visible')

			const hiddenDir = join(TEST_DIR, '.hidden-dir')
			await mkdir(hiddenDir, { recursive: true })
			await writeFile(join(hiddenDir, 'file.md'), '# In hidden dir')

			const files = await findMarkdownFiles(TEST_DIR)

			expect(files).toContain(join(TEST_DIR, '.hidden.md'))
			expect(files).toContain(join(TEST_DIR, 'visible.md'))
			expect(files).toContain(join(hiddenDir, 'file.md'))
		})

		it('should handle mixed content directory structure', async () => {
			const docsDir = join(TEST_DIR, 'docs')
			const srcDir = join(TEST_DIR, 'src')

			await mkdir(docsDir, { recursive: true })
			await mkdir(srcDir, { recursive: true })

			await writeFile(join(TEST_DIR, 'README.md'), '# README')
			await writeFile(join(docsDir, 'guide.md'), '# Guide')
			await writeFile(join(docsDir, 'api.md'), '# API')
			await writeFile(join(srcDir, 'index.js'), 'code')
			await writeFile(join(srcDir, 'notes.md'), '# Notes')

			const files = await findMarkdownFiles(TEST_DIR)

			expect(files).toHaveLength(4)
			expect(files).toContain(join(TEST_DIR, 'README.md'))
			expect(files).toContain(join(docsDir, 'guide.md'))
			expect(files).toContain(join(docsDir, 'api.md'))
			expect(files).toContain(join(srcDir, 'notes.md'))
		})
	})
})
