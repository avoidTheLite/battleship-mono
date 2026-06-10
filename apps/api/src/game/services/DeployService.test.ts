import { describe, expect, beforeEach, jest } from "@jest/globals";
import { DeployError } from "../../common/types/errors.ts";
import type { Board, GameState } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import DeployService from "./DeployService.ts";

function emptyBoard(): Board {
    return Array.from({ length: 10 }, () => Array(10).fill("O")) as Board;
}

describe('Deploy Service Test', () => {
    let mockGameStateController: any;
    let deployService: DeployService;

    beforeEach(() => {
        mockGameStateController = {
            getGame: jest.fn(),
            saveGame: jest.fn()
        };
        deployService = new DeployService(mockGameStateController);
    });

    it('should reject boards with invalid ship markers even when occupied count is 17', async () => {
        const gameState: GameState = createTestGame();
        const deployBoard = emptyBoard();
        const occupiedCells: [number, number][] = [
            [0, 0], [0, 1], [0, 2], [0, 3], [0, 4],
            [1, 0], [1, 1], [1, 2], [1, 3],
            [2, 0], [2, 1], [2, 2],
            [3, 0], [3, 1], [3, 2],
            [4, 0], [4, 1]
        ];
        for (const [row, column] of occupiedCells) {
            deployBoard[row][column] = 'X';
        }

        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand('test', deployBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject malformed board shapes before reading cells', async () => {
        const gameState: GameState = createTestGame();
        const deployBoard = emptyBoard();
        deployBoard.pop();

        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand('test', deployBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
});
