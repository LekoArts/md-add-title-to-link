import antfu from '@antfu/eslint-config'

export default antfu({
	typescript: true,
	stylistic: {
		indent: 'tab',
		quotes: 'single',
		semi: false,
	},
	rules: {
		'node/prefer-global/process': 'off',
		'no-console': 'off',
	},
	ignores: [
		'OBSIDIAN_SUPPORT.md',
	],
})
