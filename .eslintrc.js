const esLintConfig = {
    extends: ["plugin:prettier/recommended", "plugin:@next/next/recommended"],
    plugins: ["@typescript-eslint", "react", "react-hooks"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 6,
        sourceType: "module",
        ecmaFeatures: {
            jsx: true,
        },
    },
    rules: {
        "no-underscore-dangle": "off",
        "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
};

module.exports = esLintConfig;
