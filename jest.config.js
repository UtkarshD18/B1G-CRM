module.exports = {
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/setup.js"],
  moduleNameMapper: {
    "^uuid$": "<rootDir>/tests/mocks/uuid.js",
    "^@whiskeysockets/baileys$": "<rootDir>/tests/mocks/baileys.js"
  }
};
