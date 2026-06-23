import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Board, GameState } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { DeployError } from "../../common/types/errors.ts";
import DeployService from "./DeployService.ts";

describe('Deploy Service Test', () => {
    let mockGameStateController: any;
    let deployService: DeployService;

    beforeEach(() => {
        mockGameStateController = {
            updateGame: jest.fn()
        };
        deployService = new DeployService(mockGameStateController);
    });

    function mockUpdateWith(gameState: GameState) {
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID, update) => update(gameState));
    }

    it('rejects boards with invalid ship markers even when 17 cells are occupied', async () => {
        const board = Array.from({ length: 10 }, () => Array(10).fill('O')) as Board;
        for (let i = 0; i < 17; i++) {
            board[Math.floor(i / 10)][i % 10] = 'X';
        }
        mockUpdateWith(createTestGame());

        await expect(deployService.deployCommand('test', board)).rejects.toThrow(DeployError);
    });
});
