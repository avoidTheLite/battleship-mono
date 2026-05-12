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
        '^@battleship/util/appConfig$': '<rootDir>/../../packages/util/src/appConfig.ts',
        '^@battleship/util/Logger$': '<rootDir>/../../packages/util/src/Logger.ts',
        '^@battleship/util/logMiddleware$': '<rootDir>/../../packages/util/src/middleware/logMiddleware.ts',
        '^@battleship/util/logError$': '<rootDir>/../../packages/util/src/middleware/logError.ts',
    },
    setupFilesAfterEnv: ['<rootDir>/src/jest.setup.ts'],
    testEnvironment: 'node',
}

export default jestConfig