import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import type { Board } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
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
            updateGame: jest.fn()
        };
        deployService = new DeployService(mockGameStateController);
    });

    it('rejects boards with invalid ship markers even when the total ship-cell count is 17', async () => {
        const invalidBoard = createValidDeployBoard();
        invalidBoard[4][1] = 'X';

        await expect(deployService.deployCommand('test', invalidBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.updateGame).not.toHaveBeenCalled();
    });

    it('persists a valid deployment and advances the deploy turn', async () => {
        const deployBoard = createValidDeployBoard();
        const gameState = createTestGame();
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID, update) => update(gameState));

        const updatedGameState = await deployService.deployCommand('test', deployBoard);

        expect(updatedGameState.players[0].board_data).toBe(deployBoard);
        expect(updatedGameState.phase).toBe('deploy');
        expect(updatedGameState.active_player_index).toBe(1);
    });
});
