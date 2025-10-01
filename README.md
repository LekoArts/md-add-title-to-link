# md-add-title-to-link

A CLI tool that automatically converts markdown links from `[https://domain.tld](https://domain.tld)` format to `[Website Title](https://domain.tld)` by fetching the actual page title.

Perfect for Obsidian users! When you paste URLs into Obsidian, they're automatically formatted as `[url](url)`, which isn't great for readability. This tool fixes that by fetching the actual page titles.

## Features

- 🚀 **Fast & Efficient** - Uses Node.js built-in `http`/`https` modules with no heavy dependencies
- 🔄 **Recursive Processing** - Finds and processes all `.md` files in a directory tree
- 💾 **Smart Caching** - Caches fetched titles to avoid duplicate requests
- ⚡ **Parallel Processing** - Fetches multiple URLs concurrently for better performance
- 🔀 **Redirect Handling** - Automatically follows HTTP redirects (301, 302, etc.) up to 5 hops
- 🎯 **Selective Updates** - Only converts links where text matches the URL (preserves custom link text)
- 🛡️ **Safe** - Respects title attributes, handles network errors gracefully
- 👁️ **Preview Mode** - `--dry-run` flag to see changes before applying them
- 📝 **Verbose Output** - `--verbose` flag for detailed change information

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/md-add-title-to-link.git
cd md-add-title-to-link

# Install dependencies
pnpm install

# Run the tool
pnpm start /path/to/your/markdown/files
```

## Usage

### Basic Usage

```bash
pnpm start /path/to/markdown/files
```

### Preview Changes (Dry Run)

```bash
pnpm start /path/to/markdown/files --dry-run
```

### Verbose Output

```bash
pnpm start /path/to/markdown/files --verbose
```

### Combined Flags

```bash
pnpm start /path/to/markdown/files --dry-run --verbose
```

## Examples

### Before

```markdown
# My Notes

Check out [https://github.com/sindresorhus/trash-cli](https://github.com/sindresorhus/trash-cli)

Some links:
- [https://nodejs.org](https://nodejs.org)
- [https://www.typescriptlang.org](https://www.typescriptlang.org)

> Quote with link: [https://deno.land](https://deno.land)
```

### After

```markdown
# My Notes

Check out [GitHub - sindresorhus/trash-cli: Move files and folders to the trash](https://github.com/sindresorhus/trash-cli)

Some links:
- [Node.js — Run JavaScript Everywhere](https://nodejs.org)
- [TypeScript: JavaScript With Syntax For Types](https://www.typescriptlang.org)

> Quote with link: [Deno — A modern runtime for JavaScript and TypeScript](https://deno.land)
```

## What Gets Converted

✅ **Will be converted:**
- `[https://example.com](https://example.com)` → `[Page Title](https://example.com)`
- Links in lists, blockquotes, and paragraphs
- Links with bold/italic formatting: `**[url](url)**`
- Autolinks: `<https://example.com>`

❌ **Will NOT be converted:**
- `[Custom Text](https://example.com)` - Already has custom text
- `[https://example.com](https://example.com "tooltip")` - Has title attribute
- Links where the title fetch fails (network error, no title tag, etc.)

## Output Example

```
Processing markdown files in: /Users/you/notes
Found 5 markdown file(s)

Processing: /Users/you/notes/README.md
  ✓ Found 3 link(s) to update
  ✓ File updated

Processing: /Users/you/notes/guide.md
  - No links to update

Processing: /Users/you/notes/resources.md
  ✓ Found 7 link(s) to update
  ✓ File updated

✓ Done!
```

### With `--verbose` flag:

```
Processing: /Users/you/notes/README.md
  ✓ Found 3 link(s) to update
    "https://github.com/vitest-dev/vitest" → "GitHub - vitest-dev/vitest: Next generation testing framework"
    "https://nodejs.org" → "Node.js — Run JavaScript Everywhere"
    "https://deno.land" → "Deno — A modern runtime for JavaScript and TypeScript"
  ✓ File updated
```

## Development

### Run Tests

```bash
pnpm test
```

### Run Linting

```bash
pnpm lint
```

## Requirements

- Node.js (any recent version)
- pnpm

## License

MIT
