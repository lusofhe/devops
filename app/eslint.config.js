import js from '@eslint/js';

export default [
  // Apply to all JavaScript files
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        // Timer globals
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly'
      }
    },
    rules: {
      // Extend recommended rules
      ...js.configs.recommended.rules,

      // Custom rules for your project
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      'no-console': 'off', // Allow console.log for this app
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],

      // Node.js specific rules
      'no-process-exit': 'off', // Allow process.exit() for this app

      // Best practices
      'eqeqeq': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Style rules (relaxed for DevOps project)
      'max-len': ['warn', { 'code': 120 }],
      'no-trailing-spaces': 'warn',
      'comma-dangle': ['error', 'never']
    }
  },

  // Global ignores
  {
    ignores: [
      'node_modules/',
      'coverage/',
      'public/',
      'views/',
      'docs/',
      'dist/',
      'build/',
      '*.min.js',
      'logs/',
      'tmp/',
      'temp/',
      '.eslintrc.js' // Ignore old config file
    ]
  }
];
