import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { DeployError } from "../../common/types/errors.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import type { Board, GameState } from "../../common/types/types.ts";
import DeployService from "./DeployService.ts";

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

    it('should reject boards with occupied cells that are not valid ship keys', async () => {
        const gameState = createTestGame();
        const invalidBoard = createBoard();
        for (let i = 0; i < 17; i++) {
            invalidBoard[Math.floor(i / 10)][i % 10] = 'X';
        }

        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand('test', invalidBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject boards missing the expected count for each ship', async () => {
        const gameState = createTestGame();
        const invalidBoard: Board = createBoard();
        for (let i = 0; i < 17; i++) {
            invalidBoard[Math.floor(i / 10)][i % 10] = 'A';
        }

        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand('test', invalidBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
});
