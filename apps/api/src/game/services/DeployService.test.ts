import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import DeployService from "./DeployService.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { Board, GameState } from "../../common/types/types.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";

function createValidDeployBoard(): Board {
    const board = createBoard();
    const placements = [
        ['A', 5],
        ['B', 4],
        ['C', 3],
        ['S', 3],
        ['D', 2]
    ] as const;
    let column = 0;
    for (const [shipKey, size] of placements) {
        for (let row = 0; row < size; row++) {
            board[row][column] = shipKey;
        }
        column += 1;
    }
    return board;
}

describe('Deploy Service Test', () => {
    let mockGameStateController: any;
    let deployService: DeployService;

    beforeEach(() => {
        mockGameStateController = {
            getGame: jest.fn(),
            saveGame: jest.fn(async (_gameID: string, gameState: GameState) => gameState)
        };
        deployService = new DeployService(mockGameStateController);
    });

    test('rejects boards with unknown ship markers', async () => {
        const gameState = createTestGame();
        const board = createValidDeployBoard();
        board[0][0] = 'Z';
        mockGameStateController.getGame.mockResolvedValue(gameState);

        await expect(deployService.deployCommand('test', board)).rejects.toThrow(DeployError);
    });

    test('rejects boards with incorrect ship counts', async () => {
        const gameState = createTestGame();
        const board = createValidDeployBoard();
        board[0][0] = 'O';
        mockGameStateController.getGame.mockResolvedValue(gameState);

        await expect(deployService.deployCommand('test', board)).rejects.toThrow(DeployError);
    });
});
