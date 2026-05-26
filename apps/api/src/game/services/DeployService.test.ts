import DeployService from "./DeployService.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { Board, GameState } from "../../common/types/types.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { beforeEach, describe, expect, jest } from "@jest/globals";

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
    let gameState: GameState;

    beforeEach(() => {
        gameState = createTestGame();
        mockGameStateController = {
            getGame: jest.fn(),
            saveGame: jest.fn()
        };
        mockGameStateController.getGame.mockResolvedValue(gameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, updatedGameState: GameState) => updatedGameState);
        deployService = new DeployService(mockGameStateController);
    });

    it('accepts a board with the exact expected ship keys and counts', async () => {
        const deployBoard = createValidDeployBoard();

        await deployService.deployCommand('test', deployBoard);

        const savedGameState = mockGameStateController.saveGame.mock.calls[0][1] as GameState;
        expect(savedGameState.players[0].board_data).toBe(deployBoard);
        expect(savedGameState.phase).toBe('deploy');
        expect(savedGameState.active_player_index).toBe(1);
    });

    it('rejects unknown ship markers that would crash later attacks', async () => {
        const deployBoard = createValidDeployBoard();
        deployBoard[0][0] = 'X';

        await expect(deployService.deployCommand('test', deployBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('rejects boards with the wrong ship distribution even when 17 cells are occupied', async () => {
        const deployBoard = createValidDeployBoard();
        deployBoard[0][0] = 'B';

        await expect(deployService.deployCommand('test', deployBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
});
