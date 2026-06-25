import { describe, expect, beforeEach, it, jest } from "@jest/globals";

import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { Board, GameState } from "../../common/types/types.ts";
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
            getGame: jest.fn(),
            saveGame: jest.fn()
        };
        deployService = new DeployService(mockGameStateController);
    });

    it('should save a valid deployment board', async () => {
        const gameID = 'test';
        const deployBoard = createValidDeployBoard();
        const gameState: GameState = createTestGame();
        let savedGameState: GameState | undefined;

        mockGameStateController.getGame.mockImplementation(async () => savedGameState ?? gameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID, updatedGameState) => {
            savedGameState = updatedGameState;
            return updatedGameState;
        });

        const result = await deployService.deployCommand(gameID, deployBoard);

        expect(result.players[0].board_data).toBe(deployBoard);
        expect(result.active_player_index).toBe(1);
        expect(result.phase).toBe('deploy');
    });

    it('should reject unknown ship markers', async () => {
        const gameID = 'test';
        const deployBoard = createValidDeployBoard();
        const gameState: GameState = createTestGame();

        deployBoard[0][0] = 'X';
        mockGameStateController.getGame.mockResolvedValue(gameState);

        await expect(
            deployService.deployCommand(gameID, deployBoard)
        ).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
});
