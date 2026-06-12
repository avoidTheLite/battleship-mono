import { beforeEach, describe, expect, it, jest } from "@jest/globals";
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

    function mockGame(gameState: GameState): void {
        mockGameStateController.updateGame.mockImplementation(async (
            _gameID: string,
            update: (gameState: GameState) => GameState
        ) => update(gameState));
    }

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

    it('should reject boards with invalid ship markers', async () => {
        const board = createBoard();
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10 && row * 10 + col < 17; col++) {
                board[row][col] = 'X';
            }
        }

        await expect(deployService.deployCommand('test', board)).rejects.toThrow(DeployError);
        expect(mockGameStateController.updateGame).not.toHaveBeenCalled();
    });

    it('should reject boards with the wrong ship composition', async () => {
        const board = createBoard();
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10 && row * 10 + col < 17; col++) {
                board[row][col] = 'A';
            }
        }

        await expect(deployService.deployCommand('test', board)).rejects.toThrow(DeployError);
        expect(mockGameStateController.updateGame).not.toHaveBeenCalled();
    });

    it('should save a valid deployment and advance the deploy turn', async () => {
        const gameState = createTestGame();
        const deployBoard = createValidDeployBoard();
        mockGame(gameState);

        const result = await deployService.deployCommand('test', deployBoard);

        expect(result.players[0].board_data).toBe(deployBoard);
        expect(result.phase).toBe('deploy');
        expect(result.active_player_index).toBe(1);
    });
});
