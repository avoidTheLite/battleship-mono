import type { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^@battleship/util/appConfig$': '<rootDir>/../../packages/util/src/appConfig.ts',
        '^@battleship/util/Logger$': '<rootDir>/../../packages/util/src/Logger.ts',
        '^@battleship/util/logMiddleware$': '<rootDir>/../../packages/util/src/middleware/logMiddleware.ts',
    },
    transform: {
        "^.+\\.[tj]sx?$": [
        'ts-jest',
        {
          useESM: true,
        },
      ],
    },
    testEnvironment: 'node',
}

export default jestConfig