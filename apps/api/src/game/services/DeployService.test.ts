import { describe, expect, beforeEach, it, jest } from "@jest/globals";
import type { Board, GameState } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import DeployService from "./DeployService.ts";

describe('Deploy Service Test', () => {
    let mockGameStateController: any;
    let deployService: DeployService;

    beforeEach(() => {
        mockGameStateController = {
            updateGame: jest.fn()
        };
        deployService = new DeployService(mockGameStateController);
    });

    function createValidDeployBoard(): Board {
        const board = createBoard();
        for (let col = 0; col < 5; col++) {
            board[0][col] = 'A';
        }
        for (let col = 0; col < 4; col++) {
            board[1][col] = 'B';
        }
        for (let col = 0; col < 3; col++) {
            board[2][col] = 'C';
            board[3][col] = 'S';
        }
        for (let col = 0; col < 2; col++) {
            board[4][col] = 'D';
        }
        return board;
    }

    function mockUpdateGame(gameState: GameState): void {
        mockGameStateController.updateGame.mockImplementation(async (_gameID, updateGameState) => {
            return updateGameState(gameState);
        });
    }

    it('should save a valid deploy board and advance deployment turn', async () => {
        const gameState = createTestGame();
        const deployBoard = createValidDeployBoard();
        mockUpdateGame(gameState);

        const result = await deployService.deployCommand('test', deployBoard);

        expect(result.players[0].board_data).toBe(deployBoard);
        expect(result.phase).toBe('deploy');
        expect(result.active_player_index).toBe(1);
    });

    it('should reject invalid ship markers before saving', async () => {
        const deployBoard = createBoard();
        for (let col = 0; col < 10; col++) {
            deployBoard[0][col] = 'X';
        }
        for (let col = 0; col < 7; col++) {
            deployBoard[1][col] = 'X';
        }

        await expect(deployService.deployCommand('test', deployBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.updateGame).not.toHaveBeenCalled();
    });
});
