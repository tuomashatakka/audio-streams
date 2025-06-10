import stylistic from '@stylistic/eslint-plugin'
import tsplugin from '@typescript-eslint/eslint-plugin'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import omitPlugin from 'eslint-plugin-omit-unnecessary'
import whitespaced from 'eslint-plugin-whitespaced'
import noInlineMultilineTypesPlugin from 'eslint-plugin-no-inline-multiline-types'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'


const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory:     import.meta.dirname,
  recommendedConfig: js.configs.recommended,
})


const plugins = {
  '@stylistic':         stylistic,
  '@typescript-eslint': tsplugin,
  'omit':               omitPlugin,
  'whitespaced':        whitespaced,
  'no-inline-types':    noInlineMultilineTypesPlugin,
}

const config =
  {
    files:           [ '**/*.{js,jsx,mjs,cjs,ts,tsx}' ],
    languageOptions: {
      ecmaVersion:   'latest',
      sourceType:    'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      'import/internal-regex': '^@/(.+)',
      'import/resolver':       {
        node: {
          extensions: [ '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs' ],
        },
        typescript: {
          alwaysTryTypes: true,
        },
      },
      'react': {
        version: 'detect',
      },
    },
    ignores: [ '**/node_modules/**', 'dist/**' ],
    plugins,
    rules:   {
      'tailwindcss/no-custom-classname':     'off',
      'tailwindcss/classnames-order':        'off',
      'whitespaced/block-padding':           'off',
      'whitespaced/class-property-grouping': 'warn',
      'whitespaced/aligned-assignments':     'off',
      'whitespaced/consistent-line-spacing': [ 'off', {
        beforeImports:      0,
        beforeExports:      1,
        afterImports:       2,
        ignoreTopLevelCode: true,

      }],
      'whitespaced/multiline-format': [ 'off', {
        objectAlignment:   'value',
        multilineStyle:    'never',
        consistentSpacing: false,
      }],
      'no-inline-types/no-inline-multiline-types': 'warn',

      'multiline-comment-style': [
        'warn',
        'separate-lines',
        { checkJSDoc: false },
      ],
      '@stylistic/lines-around-comment': [
        'warn',
        {
          beforeBlockComment: true,
          beforeLineComment:  false,
          afterLineComment:   false,
          allowClassEnd:      true,
          allowBlockEnd:      true,
        },
      ],

      '@typescript-eslint/no-empty-object-type': [ 'warn' ],

      // TODO
      // 'import/no-extraneous-dependencies':      [ 'warn' ],
      // 'import/consistent-type-specifier-style': [ 'warn', 'prefer-top-level' ],
      // 'import/newline-after-import':            [ 'warn', { count: 2 }],
      // 'import/no-unassigned-import':            [
      //   'error',
      //   { allow: [ '**/*.{le,c,sc,sa}ss', 'server-only' ]},
      // ],
      // 'import/prefer-default-export': [ 'off' ],
      // 'import/no-mutable-exports':    [ 'error' ],
      // 'import/order':                 [
      //   'off',
      //   {
      //     'groups': [
      //       'builtin',
      //       'type',
      //       'external',
      //       [ 'parent', 'sibling', 'index' ],
      //       [ 'internal', 'object' ],
      //     ],
      //     'alphabetize':             { order: 'asc', caseInsensitive: true },
      //     'distinctGroup':           true,
      //     'warnOnUnassignedImports': true,
      //     'newlines-between':        'always',
      //     'pathGroups':              [{ group: 'internal', pattern: '**/*.s?css' }],
      //   },
      // ],

      // Typescript
      '@stylistic/ban-ts-comment': [ 'off', 'allow-single-line' ],

      // Enforced practices (enforce functional and orthogonal code)
      'complexity':           [ 'warn', { max: 14 }],
      'eqeqeq':               [ 'warn', 'smart' ],
      'arrow-body-style':     [ 'warn', 'as-needed' ],
      'max-lines':            [ 'warn', { max: 666, skipComments: true, skipBlankLines: true }],
      'max-statements':       [ 'warn', 40 ],
      'max-depth':            [ 'warn', 6 ],
      'no-console':           [ 0 ],
      'no-debugger':          [ 'warn' ],
      'dot-notation':         [ 'warn' ],
      'no-undef':             [ 0 ],
      'use-isnan':            [ 'error' ],
      'no-obj-calls':         [ 'error' ],
      'no-new-symbol':        [ 'error' ],
      'no-func-assign':       [ 'error' ],
      'no-class-assign':      [ 'error' ],
      'no-array-constructor': [ 'error' ],

      'omit/omit-unnecessary-parens-brackets':    [ 'warn' ],
      // '@stylistic/function-paren-newline':           [ 'warn', 'always' ],
      '@stylistic/function-call-spacing':         [ 'warn', 'never' ],
      '@stylistic/computed-property-spacing':     [ 'warn', 'never' ],
      '@stylistic/brace-style':                   [ 'warn', 'stroustrup', { allowSingleLine: false }],
      '@stylistic/comma-dangle':                  [ 'warn', 'only-multiline' ],
      '@stylistic/comma-spacing':                 [ 'warn', { before: false, after: true }],
      '@stylistic/comma-style':                   [ 'warn', 'last' ],
      '@stylistic/key-spacing':                   [ 'warn', { beforeColon: false, afterColon: true, align: 'value' }],
      '@stylistic/keyword-spacing':               [ 'warn', { before: true, after: true }],
      '@stylistic/object-property-newline':       [ 'warn', { allowAllPropertiesOnSameLine: true, allowMultiplePropertiesPerLine: false }],
      '@stylistic/max-len':                       [ 'off', 400 ],
      '@stylistic/no-tabs':                       [ 'warn' ],
      '@stylistic/no-extra-parens':               [ 'warn', 'all' ],
      '@stylistic/jsx-function-call-newline':     [ 'warn', 'always' ],
      '@stylistic/no-multiple-empty-lines':       [ 'warn', { max: 2, maxEOF: 0, maxBOF: 0 }],
      '@stylistic/no-trailing-spaces':            [ 'warn', { skipBlankLines: false, ignoreComments: false }],
      '@stylistic/no-confusing-arrow':            [ 'off' ],
      '@stylistic/no-whitespace-before-property': [ 'warn' ],
      '@stylistic/space-in-parens':               [ 'warn', 'never' ],
      '@stylistic/space-infix-ops':               [ 'warn', { int32Hint: false }],
      '@stylistic/space-unary-ops':               [ 'warn', { words: true, nonwords: false }],
      '@stylistic/switch-colon-spacing':          [ 'warn', { after: true, before: false }],
      '@stylistic/template-curly-spacing':        [ 'warn', 'never' ],
      '@stylistic/wrap-iife':                     [ 'warn', 'inside' ],
      '@stylistic/wrap-regex':                    [ 'warn' ],
      '@stylistic/jsx-curly-spacing':             [ 'warn', { when: 'always', spacing: { objectLiterals: 'never' }}],
      '@stylistic/object-curly-spacing':          [ 'warn', 'always', { arraysInObjects: false, objectsInObjects: false }],
      '@stylistic/array-bracket-spacing':         [ 'warn', 'always', { arraysInArrays: false, objectsInArrays: false }],
      '@stylistic/new-parens':                    [ 'warn', 'always' ],
      '@stylistic/operator-linebreak':            [ 'warn', 'after', { overrides: { '?': 'before', ':': 'before' }}],
      '@stylistic/quote-props':                   [ 'warn', 'consistent-as-needed', { keywords: false, unnecessary: true, numbers: false }],
      '@stylistic/arrow-spacing':                 [ 'warn' ],
      '@stylistic/func-call-spacing':             [ 'warn', 'never' ],
      '@stylistic/newline-per-chained-call':      [ 'warn', { ignoreChainWithDepth: 2 }],
      '@stylistic/lines-between-class-members':   [ 'warn', 'always', { exceptAfterSingleLine: true }],
      '@stylistic/one-var-declaration-per-line':  [ 'warn', 'always' ],
      '@stylistic/arrow-parens':                  [ 'warn', 'as-needed' ],
      '@stylistic/dot-location':                  [ 'warn', 'property' ],
      '@stylistic/eol-last':                      [ 'warn', 'always' ],
      '@stylistic/multiline-ternary':             [ 'warn', 'always-multiline' ],
      '@stylistic/no-floating-decimal':           [ 'warn' ],
      '@stylistic/no-mixed-operators':            [ 'warn' ],
      '@stylistic/no-extra-semi':                 [ 'warn' ],
      '@stylistic/semi-spacing':                  [ 'warn', { before: false, after: true }],
      '@stylistic/semi-style':                    [ 'warn', 'last' ],
      '@stylistic/semi':                          [ 'warn', 'never' ],
      '@stylistic/space-before-function-paren':   [ 'warn', { anonymous: 'always', named: 'always', asyncArrow: 'always' }],
      '@stylistic/template-tag-spacing':          [ 'warn', 'always' ],
      '@stylistic/yield-star-spacing':            [ 'warn', 'after' ],
      '@stylistic/quotes':                        [ 'warn', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      '@stylistic/jsx-quotes':                    [ 'warn', 'prefer-single' ],
      '@stylistic/jsx-props-no-multi-spaces':     [ 'off' ],
      '@stylistic/jsx-equals-spacing':            [ 'warn', 'never' ],
      '@stylistic/jsx-max-props-per-line':        [ 'warn', { maximum: 1, when: 'multiline' }],
      '@stylistic/jsx-self-closing-comp':         [ 'warn', { component: true, html: true }],
      '@stylistic/jsx-tag-spacing':               [ 'warn', { closingSlash: 'never', beforeSelfClosing: 'always', beforeClosing: 'never', afterOpening: 'never' }],
      '@stylistic/jsx-indent':                    [ 'warn', 2, { checkAttributes: true }],
      '@stylistic/jsx-indent-props':              [ 'warn', { indentMode: 2, ignoreTernaryOperator: true, SwitchCase: 1 }],
      '@stylistic/indent':                        [ 'warn', 2, { SwitchCase: 1, CallExpression: { arguments: 'first' }}],
      '@stylistic/indent':                        [ 'warn', 2, { offsetTernaryExpressions: false, flatTernaryExpressions: false, SwitchCase: 1 }],

      // Block padding
      '@stylistic/no-multi-spaces': [
        'warn',
        {
          exceptions: {
            Property:           true,
            TSTypeAnnotation:   true,
            VariableDeclarator: true,
            ObjectExpression:   false,
          },
        },
      ],
      '@stylistic/spaced-comment':                   [ 'warn', 'always', { markers: [ '/' ]}],
      '@stylistic/padded-blocks':                    [ 'warn', 'never' ],
      '@stylistic/nonblock-statement-body-position': [ 'warn', 'below' ],
      '@stylistic/space-before-blocks':              [ 'warn', 'always' ],
      '@typescript-eslint/no-implicit-any':          'off',
      '@typescript-eslint/no-explicit-any':          'off',
      '@typescript-eslint/no-non-null-assertion':    'off',
      '@typescript-eslint/no-unused-vars':           'off',
      'no-unused-vars':                              'off',
      '@stylistic/no-mixed-operators':               'off',

      '@stylistic/padding-line-between-statements': [
        'warn',
        { blankLine: 'always', prev: 'directive', next: '*' },
        { blankLine: 'any', prev: 'directive', next: 'directive' },
        { blankLine: 'always', next: [ 'const', 'let', 'var' ], prev: '*' },
        { blankLine: 'any', prev: [ 'const', 'let', 'var' ], next: '*' },
        { blankLine: 'any',
          prev:      [ 'const', 'let', 'var' ],
          next:      [ 'const', 'let', 'var' ]},
        { prev: 'import', next: '*', blankLine: 'always' },
        { prev: 'import', next: 'import', blankLine: 'any' },
        { blankLine: 'always', prev: '*', next: [ 'export' ]},
        { blankLine: 'never', prev: 'case', next: '*' },
        { blankLine: 'never', prev: 'default', next: '*' },
        { blankLine: 'always',
          prev:      [ 'block-like', 'block' ],
          next:      [ 'multiline-expression', 'function', 'block-like', 'block' ]},
        { blankLine: 'any',
          prev:      [ 'multiline-expression', 'function', 'block-like', 'block' ],
          next:      [ 'multiline-expression', 'function', 'block-like', 'block' ]},
      ],
    },
    files:           [
      'app/**/*.{js,jsx,mjs,cjs,ts,tsx}',
      'eslint.config.mjs',
    ],
    languageOptions: {
      ecmaVersion:   'latest',
      sourceType:    'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
  }

export default tseslint.config(...tseslint.configs.recommended,
  ...compat.config({
  }), config)
