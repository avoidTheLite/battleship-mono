import { describe, expect, beforeEach, it, jest } from "@jest/globals";
import DeployService from "./DeployService.ts";
import { DeployError } from "../../common/types/errors.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import createBoard from "../../common/util/createBoard.ts";
import type { Board, GameState } from "../../common/types/types.ts";

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

    it('should reject boards with the right occupied count but invalid ship composition', async () => {
        const gameState = createTestGame();
        const invalidBoard = createBoard();
        for (let row = 0; row < 2; row++) {
            for (let column = 0; column < 10; column++) {
                if ((row * 10) + column < 17) {
                    invalidBoard[row][column] = 'A';
                }
            }
        }
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand('test', invalidBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject boards containing markers that cannot map to ship data', async () => {
        const gameState = createTestGame();
        const invalidBoard = createValidDeployBoard();
        invalidBoard[9][9] = 'X';
        invalidBoard[0][0] = 'O';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand('test', invalidBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should save valid deploy boards and advance to the next player', async () => {
        const gameState = createTestGame();
        const validBoard = createValidDeployBoard();
        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementation(async () => gameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID, savedGameState: GameState) => savedGameState);

        await deployService.deployCommand('test', validBoard);

        const savedGameState = mockGameStateController.saveGame.mock.calls[0][1] as GameState;
        expect(savedGameState.players[0].board_data).toBe(validBoard);
        expect(savedGameState.active_player_index).toBe(1);
        expect(savedGameState.phase).toBe('deploy');
    });
});
