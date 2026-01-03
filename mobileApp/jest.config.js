module.exports = {
  preset: 'react-native',
  setupFiles: [
    '<rootDir>/node_modules/react-native/jest/setup.js',
    './jest.setup.js',
  ],
  moduleNameMapper: {
    '\\.(gif|jpg|jpeg|png|svg|webp)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
