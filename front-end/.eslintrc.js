module.exports = {
    root: true,
    env: {
        node: true,
    },
    extends: ['plugin:vue/vue3-essential', 'eslint:recommended'],
    parserOptions: {
        parser: '@babel/eslint-parser',
    },
    globals: {
      defineProps: 'readonly',
      defineEmits: 'readonly',
    },
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-unused-vars': 'warn',
    },
};
