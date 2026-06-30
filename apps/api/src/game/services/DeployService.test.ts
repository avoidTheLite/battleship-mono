import DeployService from "./DeployService.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { Board, GameState } from "../../common/types/types.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

describe('Deploy Service Test', () => {
    let mockGameStateController: any;
    let deployService: DeployService;

    beforeEach(() => {
        mockGameStateController = {
            updateGame: jest.fn()
        };
        deployService = new DeployService(mockGameStateController);
    });

    it('rejects boards with invalid ship markers', async () => {
        const gameState: GameState = createTestGame();
        const deployBoard: Board = createBoard();

        for (let i = 0; i < 17; i++) {
            deployBoard[Math.floor(i / 10)][i % 10] = 'X';
        }
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID: string, update: (gameState: GameState) => GameState) => {
            return update(gameState);
        });

        await expect(deployService.deployCommand('test', deployBoard)).rejects.toThrow(DeployError);
    });

    it('rejects boards missing the exact ship marker counts', async () => {
        const gameState: GameState = createTestGame();
        const deployBoard: Board = createBoard();

        for (let i = 0; i < 17; i++) {
            deployBoard[Math.floor(i / 10)][i % 10] = 'A';
        }
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID: string, update: (gameState: GameState) => GameState) => {
            return update(gameState);
        });

        await expect(deployService.deployCommand('test', deployBoard)).rejects.toThrow(DeployError);
    });
});
