import DeployService from "./DeployService.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { Board, GameState } from "../../common/types/types.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";

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

    function mockPersistedGame(gameState: GameState): void {
        let persistedGameState = gameState;
        mockGameStateController.getGame.mockImplementation(async () => persistedGameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, savedGameState: GameState) => {
            persistedGameState = savedGameState;
            return savedGameState;
        });
    }

    it('should reject boards with invalid ship markers', async () => {
        const gameState = createTestGame();
        const deployBoard = createValidDeployBoard();
        deployBoard[0][0] = 'X';
        mockPersistedGame(gameState);

        await expect(deployService.deployCommand('test', deployBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject boards with the wrong ship counts', async () => {
        const gameState = createTestGame();
        const deployBoard = createValidDeployBoard();
        deployBoard[0][0] = 'O';
        mockPersistedGame(gameState);

        await expect(deployService.deployCommand('test', deployBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should save valid boards for the active player', async () => {
        const gameState = createTestGame();
        const deployBoard = createValidDeployBoard();
        mockPersistedGame(gameState);

        await deployService.deployCommand('test', deployBoard);

        expect(mockGameStateController.saveGame).toHaveBeenCalled();
        const savedGameState = mockGameStateController.saveGame.mock.calls[0][1] as GameState;
        expect(savedGameState.players[0].board_data).toBe(deployBoard);
        expect(savedGameState.active_player_index).toBe(1);
    });
});
