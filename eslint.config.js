import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'
import importPlugin from "eslint-plugin-import";

export default tseslint.config([
    globalIgnores(['dist']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs['recommended-latest'],
            reactRefresh.configs.vite,
            importPlugin.flatConfigs.recommended
        ],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        rules: {
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
            "prettier/prettier": 0,
            "react/react-in-jsx-scope": 'off',
            "semi": ["error", "always"],
            "func-style": ["error", "expression"],
            "no-console": "warn",
            "@typescript-eslint/no-explicit-any": "error",
            "indent": ['error', 4],
            "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0, maxBOF: 0 }],
            "import/order": [
                "error",
                {
                    groups: [
                        "builtin",
                        "external",
                        "internal",
                        ["parent", "sibling", "index"],
                        "object",
                        "type"
                    ],
                    pathGroups: [
                        {
                            pattern: "react",
                            group: "external",
                            position: "before"
                        }
                    ],
                    pathGroupsExcludedImportTypes: ["react"],
                    "newlines-between": "never",
                    alphabetize: {
                        order: "asc",
                        caseInsensitive: true
                    }
                }
            ],
        },
    },
])
