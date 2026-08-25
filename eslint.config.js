import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["dist/**", "node_modules/**"]
  },
  {
    ...js.configs.recommended,
    files: ["build.js", "server.js", "eslint.config.js", "test/**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        ...globals.node
      }
    }
  },
  {
    ...js.configs.recommended,
    files: ["src/scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        ...globals.browser
      }
    }
  }
];
