import type { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
    rootDir: '..',
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
        "^.+\\.[tj]sx?$": [
        'ts-jest',
        {
          useESM: true,
        },
      ],
    },
    moduleNameMapper: {
        '^@battleship/util/logMiddleware$': '<rootDir>/../../packages/util/src/middleware/logMiddleware.ts',
        '^@battleship/util/(.*)$': '<rootDir>/../../packages/util/src/$1.ts',
    },
    setupFilesAfterEnv: ['<rootDir>/src/jest.setup.ts'],
    testEnvironment: 'node',
}

export default jestConfig