import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: ["api/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "_next/**",
    "_not-found/**",
    "404/**",
    "projects/**",
    "public/web_dev_practice/**",
    "js/**",
    "css/**",
    "*_backup.*",
  ]),
]);
