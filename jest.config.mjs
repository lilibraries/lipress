/** @type {import('jest').Config} */
export default {
  roots: ["<rootDir>/tests"],
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json" }],
  },
  moduleNameMapper: {
    "\\.(css|scss)$": "<rootDir>/tests/style-stub.ts",
    // Published imports carry `.js` extensions while the sources stay `.ts`.
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testMatch: ["<rootDir>/tests/**/*.test.(ts|tsx)"],
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts", "!src/index.ts"],
  coverageProvider: "v8",
  coverageReporters: ["text", "html"],
};
