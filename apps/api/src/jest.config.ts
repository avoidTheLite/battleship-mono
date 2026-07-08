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
      '^(\\.{1,2}/.*)\\.js$': '$1',
      '^@battleship/util/(.*)$': '<rootDir>/../../packages/util/src/$1.ts'
    },
    testEnvironment: 'node',
}

export default jestConfig