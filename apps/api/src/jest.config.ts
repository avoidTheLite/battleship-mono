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
        '^@battleship/util/(.*)$': '<rootDir>/../../packages/util/src/$1.ts',
    },
    testEnvironment: 'node',
}

export default jestConfig