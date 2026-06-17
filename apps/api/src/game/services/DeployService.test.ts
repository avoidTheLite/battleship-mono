import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { Board, GameState } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import DeployService from "./DeployService.ts";

function createValidDeployBoard(): Board {
    const board = createBoard();
    for (let i = 0; i < 5; i++) {
        board[0][i] = 'A';
    }
    for (let i = 0; i < 4; i++) {
        board[1][i] = 'B';
    }
    for (let i = 0; i < 3; i++) {
        board[2][i] = 'C';
        board[3][i] = 'S';
    }
    for (let i = 0; i < 2; i++) {
        board[4][i] = 'D';
    }
    return board;
}

describe('Deploy Service Test', () => {
    let mockGameStateController: any;
    let deployService: DeployService;

    beforeEach(() => {
        mockGameStateController = {
            updateGame: jest.fn()
        };
        deployService = new DeployService(mockGameStateController);
    });

    it('should reject boards with invalid ship markers', async () => {
        const gameState: GameState = createTestGame();
        const board = createValidDeployBoard();
        board[0][0] = 'X';
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID: string, updateGameState: (state: GameState) => GameState) => updateGameState(gameState));

        await expect(deployService.deployCommand('test', board)).rejects.toThrow(DeployError);

        expect(mockGameStateController.updateGame).toHaveBeenCalledTimes(1);
    });

    it('should reject boards with incorrect ship counts', async () => {
        const gameState: GameState = createTestGame();
        const board = createValidDeployBoard();
        board[0][0] = 'O';
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID: string, updateGameState: (state: GameState) => GameState) => updateGameState(gameState));

        await expect(deployService.deployCommand('test', board)).rejects.toThrow(DeployError);

        expect(mockGameStateController.updateGame).toHaveBeenCalledTimes(1);
    });
});
