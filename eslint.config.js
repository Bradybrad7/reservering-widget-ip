import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // ✨ Prevent console statements in production code
      'no-console': ['warn', { 
        allow: ['warn', 'error'] // Allow console.warn and console.error
      }],
      // Prefer logger service for production logging
      'no-restricted-syntax': [
        'warn',
        {
          selector: "CallExpression[callee.object.name='console'][callee.property.name!=/^(warn|error)$/]",
          message: 'Unexpected console statement. Use logger service instead.'
        }
      ]
    }
  },
])
