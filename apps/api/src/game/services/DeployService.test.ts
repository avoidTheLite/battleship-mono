import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import type { Board, GameState } from "../../common/types/types.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { DeployError } from "../../common/types/errors.ts";
import DeployService from "./DeployService.ts";

function createValidDeployBoard(): Board {
    const board = createBoard();
    board[0][0] = 'A';
    board[0][1] = 'A';
    board[0][2] = 'A';
    board[0][3] = 'A';
    board[0][4] = 'A';
    board[1][0] = 'B';
    board[1][1] = 'B';
    board[1][2] = 'B';
    board[1][3] = 'B';
    board[2][0] = 'C';
    board[2][1] = 'C';
    board[2][2] = 'C';
    board[3][0] = 'S';
    board[3][1] = 'S';
    board[3][2] = 'S';
    board[4][0] = 'D';
    board[4][1] = 'D';
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

    it('should reject boards with invalid ship markers even when occupied count is 17', async () => {
        const gameID = 'test';
        const gameState: GameState = createTestGame();
        const deployBoard = createBoard();
        for (let i = 0; i < 17; i++) {
            deployBoard[Math.floor(i / 10)][i % 10] = 'X';
        }
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand(gameID, deployBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should accept boards with the exact expected ship marker counts', async () => {
        const gameID = 'test';
        const gameState: GameState = createTestGame();
        const deployBoard = createValidDeployBoard();
        mockGameStateController.getGame.mockResolvedValueOnce(gameState).mockResolvedValueOnce(gameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID, savedGameState) => savedGameState);

        await deployService.deployCommand(gameID, deployBoard);

        expect(mockGameStateController.saveGame).toHaveBeenCalledWith(gameID, expect.objectContaining({
            active_player_index: 1
        }));
    });
});
