import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";

export default defineConfig([
  globalIgnores(["**/dist", "**/build", "**/coverage"]),
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [...tseslint.configs.recommendedTypeChecked],
    plugins: {
      "react-hooks": reactHooks,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },
  {
    files: ["src/client/**/*.{ts,tsx}", "docs/**/*.tsx"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["src/cli/**/*.ts"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["tests/**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  prettier,
]);
