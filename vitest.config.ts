import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tests/unit/**/*.test.ts"],
    css: true,
    clearMocks: true,
    coverage: {
      provider: "v8",
      include: ["src/domain/quote/**/*.ts"],
      exclude: ["src/domain/quote/index.ts", "src/domain/quote/types.ts"],
      reporter: ["text", "json-summary"],
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      },
    },
  },
});
