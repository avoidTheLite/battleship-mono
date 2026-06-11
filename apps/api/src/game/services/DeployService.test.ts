import { describe, expect, beforeEach, it, jest } from "@jest/globals";
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
            updateGame: jest.fn()
        };
        deployService = new DeployService(mockGameStateController);
    });

    function mockUpdateGameWith(gameState: GameState): void {
        mockGameStateController.updateGame.mockImplementation(async (_gameID: string, updateGameState: (gameState: GameState) => GameState) => {
            return updateGameState(gameState);
        });
    }

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

    it('deploys a valid fleet and advances to the next deployment turn', async () => {
        const gameState = createTestGame();
        const board = createValidDeployBoard();
        mockUpdateGameWith(gameState);

        const updatedGameState = await deployService.deployCommand('test', board);

        expect(updatedGameState.players[0].board_data).toBe(board);
        expect(updatedGameState.phase).toBe('deploy');
        expect(updatedGameState.active_player_index).toBe(1);
    });

    it('rejects boards with invalid markers even when the occupied count is 17', async () => {
        const board = createBoard();
        for (let row = 0; row < 10; row++) {
            for (let column = 0; column < 10; column++) {
                if ((row * 10) + column < 17) {
                    board[row][column] = 'X';
                }
            }
        }

        await expect(deployService.deployCommand('test', board)).rejects.toThrow(DeployError);
        expect(mockGameStateController.updateGame).not.toHaveBeenCalled();
    });

    it('rejects malformed board shapes without indexing missing rows', async () => {
        await expect(deployService.deployCommand('test', [] as unknown as Board)).rejects.toThrow(DeployError);
        expect(mockGameStateController.updateGame).not.toHaveBeenCalled();
    });
});
