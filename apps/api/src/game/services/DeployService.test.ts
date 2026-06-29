import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Board, GameState } from "../../common/types/types.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { DeployError } from "../../common/types/errors.ts";
import DeployService from "./DeployService.ts";

describe('DeployService', () => {
    let mockGameStateController: any;
    let deployService: DeployService;

    beforeEach(() => {
        mockGameStateController = {
            getGame: jest.fn(),
            saveGame: jest.fn()
        };
        deployService = new DeployService(mockGameStateController);
    });

    it('rejects boards with unknown ship markers even when the total occupied count is 17', async () => {
        const gameState = createTestGame();
        const invalidBoard = createValidDeployBoard();
        invalidBoard[0][0] = 'X';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand('test', invalidBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('rejects boards with incorrect ship cell counts', async () => {
        const gameState = createTestGame();
        const invalidBoard = createValidDeployBoard();
        invalidBoard[0][0] = 'O';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand('test', invalidBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('persists a valid deployment for the active player and advances the turn', async () => {
        const gameState = createTestGame();
        const validBoard = createValidDeployBoard();
        let savedGameState: GameState | undefined;
        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementationOnce(async () => savedGameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, nextGameState: GameState) => {
            savedGameState = nextGameState;
            return nextGameState;
        });

        const result = await deployService.deployCommand('test', validBoard);

        expect(result.players[0].board_data).toBe(validBoard);
        expect(result.phase).toBe('deploy');
        expect(result.active_player_index).toBe(1);
    });
});

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
