import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
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
      react.configs.flat.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React 17+ JSX transform
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',

      // Enforce hook only components
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ClassDeclaration',
          message:
            'Class components are not allowed. Use function components with hooks.',
        },
      ],
    },
  },
])
