// .cjs extension is deliberate — package.json has "type": "module", so a
// plain .js config here would be loaded as ESM and Jest's own config loader
// (which uses require()) would fail to read it.
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.jest.json" }],
  },
  moduleNameMapper: {
    "\\.(css|less|scss)$": "identity-obj-proxy",
    "\\.svg$": "<rootDir>/src/test-utils/fileMock.ts",
  },
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
};
