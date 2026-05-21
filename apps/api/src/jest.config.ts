import type { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
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
    },
    testEnvironment: 'node',
}

export default jestConfig