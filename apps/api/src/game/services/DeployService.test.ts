import { describe, it, expect, beforeEach, jest } from "@jest/globals";
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

    it('should reject boards with arbitrary occupied markers', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        const invalidBoard = createBoard();
        for (let i = 0; i < 17; i++) {
            invalidBoard[Math.floor(i / 10)][i % 10] = 'X';
        }
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID: string, mutateGameState: (gameState: GameState) => GameState) => mutateGameState(gameState));

        await expect(deployService.deployCommand(gameID, invalidBoard)).rejects.toThrow(DeployError);
    });

    it('should reject boards that do not contain the exact ship counts', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        const invalidBoard = createValidDeployBoard();
        invalidBoard[0][0] = 'B';
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID: string, mutateGameState: (gameState: GameState) => GameState) => mutateGameState(gameState));

        await expect(deployService.deployCommand(gameID, invalidBoard)).rejects.toThrow(DeployError);
    });

    it('should reject inherited property names as board markers', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        const invalidBoard = createValidDeployBoard();
        invalidBoard[9][9] = 'constructor';
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID: string, mutateGameState: (gameState: GameState) => GameState) => mutateGameState(gameState));

        await expect(deployService.deployCommand(gameID, invalidBoard)).rejects.toThrow(DeployError);
    });

    it('should reject non-string board markers', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        const invalidBoard = createValidDeployBoard();
        invalidBoard[0][0] = ['A'] as unknown as string;
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID: string, mutateGameState: (gameState: GameState) => GameState) => mutateGameState(gameState));

        await expect(deployService.deployCommand(gameID, invalidBoard)).rejects.toThrow(DeployError);
    });

    it('should reject ships that are not straight and contiguous', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        const invalidBoard = createValidDeployBoard();
        invalidBoard[0][4] = 'O';
        invalidBoard[9][9] = 'A';
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID: string, mutateGameState: (gameState: GameState) => GameState) => mutateGameState(gameState));

        await expect(deployService.deployCommand(gameID, invalidBoard)).rejects.toThrow(DeployError);
    });

    it('should save valid deploy boards and advance the turn', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        const validBoard = createValidDeployBoard();
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID: string, mutateGameState: (gameState: GameState) => GameState) => mutateGameState(gameState));

        const result = await deployService.deployCommand(gameID, validBoard);

        expect(result.players[0].board_data).toBe(validBoard);
        expect(result.phase).toBe('deploy');
        expect(result.active_player_index).toBe(1);
    });
});
