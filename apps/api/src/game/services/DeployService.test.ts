import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import DeployService from "./DeployService.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { Board, GameState } from "../../common/types/types.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";

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

    it('should reject boards with invalid ship markers', async () => {
        const gameState: GameState = createTestGame();
        const deployBoard: Board = createBoard();
        for (let i = 0; i < 17; i++) {
            deployBoard[Math.floor(i / 10)][i % 10] = 'X';
        }
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand('test', deployBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject boards with the wrong ship counts', async () => {
        const gameState: GameState = createTestGame();
        const deployBoard: Board = createBoard();
        for (let i = 0; i < 17; i++) {
            deployBoard[Math.floor(i / 10)][i % 10] = 'A';
        }
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand('test', deployBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
});
