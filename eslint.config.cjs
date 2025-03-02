const prettier = require("eslint-config-prettier");
const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  prettier,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    ignores: ["public/", "resources/"],
  },
];
