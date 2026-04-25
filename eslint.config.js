import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage', '.husky']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Pre-existing tech debt: many `catch (err: any)` blocks. Use getErrorMessage()
      // from src/api/client.ts in new code. Sweeping the existing ones is on the backlog.
      '@typescript-eslint/no-explicit-any': 'warn',

      // Fast-refresh false positives — we co-locate hooks with primitives by design
      // (useToast lives in Toast.tsx alongside ToastProvider). HMR still works fine.
      'react-refresh/only-export-components': 'warn',

      // Pre-existing setState-in-effect patterns in Layout/VerifyEmail. Backlog.
      'react-hooks/set-state-in-effect': 'warn',

      // Nudge devs toward UI primitives. Raw <button className="bg-brand ..."> and
      // similar patterns should use <Button>/<IconButton>/<Input>/<Badge>/<Card>.
      // See src/components/ui/README.md.
      'no-restricted-syntax': [
        'warn',
        {
          selector:
            "JSXOpeningElement[name.name='button'] JSXAttribute[name.name='className'] Literal[value=/bg-(brand|indigo-6|indigo-5|red-6|red-5|emerald-6|emerald-5)/]",
          message:
            'Use <Button> or <IconButton> from components/ui instead of a raw <button> with brand/action classes.',
        },
      ],
    },
  },
  // Relax the drift rule in hand-rolled complex components where raw elements are intentional.
  {
    files: [
      'src/components/ui/**',
      'src/components/Modal.tsx',
      'src/components/ImageCropModal.tsx',
    ],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  // Test files — looser rules.
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-restricted-syntax': 'off',
    },
  },
])
