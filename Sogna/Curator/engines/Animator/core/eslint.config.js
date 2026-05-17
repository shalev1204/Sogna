import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

const dummyReactHooksPlugin = {
  rules: {
    'exhaustive-deps': {
      meta: { type: 'suggestion', docs: { description: 'dummy exhaustive-deps rule' }, schema: [] },
      create: () => ({})
    },
    'rules-of-hooks': {
      meta: { type: 'suggestion', docs: { description: 'dummy rules-of-hooks rule' }, schema: [] },
      create: () => ({})
    }
  }
};

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['**/__tests__/**', '**/*.test.ts', 'dist/**', 'lib/**'],
  },
  {
    plugins: {
      'react-hooks': dummyReactHooksPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      'no-console': 'off',
      'no-useless-assignment': 'off',
      'prefer-const': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/rules-of-hooks': 'off',
    },
  }
);
