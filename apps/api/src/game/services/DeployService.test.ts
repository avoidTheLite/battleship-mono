import { describe, expect, it, beforeEach, jest } from "@jest/globals"
import DeployService from "./DeployService.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { Board, GameState } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";

function createEmptyBoard(): Board {
    return Array.from({ length: 10 }, () => Array(10).fill("O")) as Board;
}

function createValidDeployBoard(): Board {
    const board = createEmptyBoard();
    board[0][0] = "A";
    board[0][1] = "A";
    board[0][2] = "A";
    board[0][3] = "A";
    board[0][4] = "A";
    board[1][0] = "B";
    board[1][1] = "B";
    board[1][2] = "B";
    board[1][3] = "B";
    board[2][0] = "C";
    board[2][1] = "C";
    board[2][2] = "C";
    board[3][0] = "S";
    board[3][1] = "S";
    board[3][2] = "S";
    board[4][0] = "D";
    board[4][1] = "D";
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

    it('should reject boards with unknown ship markers before saving', async () => {
        const gameState = createTestGame();
        const deployBoard = createEmptyBoard();
        for (let i = 0; i < 17; i++) {
            deployBoard[Math.floor(i / 10)][i % 10] = "X";
        }

        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand('test', deployBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject boards with the wrong fleet composition before saving', async () => {
        const gameState = createTestGame();
        const deployBoard = createValidDeployBoard();
        deployBoard[0][4] = "B";

        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand('test', deployBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should save a board with the expected fleet composition', async () => {
        const gameState = createTestGame();
        const deployBoard = createValidDeployBoard();
        const savedGameState: GameState = {
            ...gameState,
            active_player_index: 1,
            players: [
                {
                    ...gameState.players[0],
                    board_data: deployBoard
                },
                gameState.players[1]
            ]
        };

        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockResolvedValueOnce(savedGameState);
        mockGameStateController.saveGame.mockResolvedValueOnce(savedGameState);

        const result = await deployService.deployCommand('test', deployBoard);

        expect(mockGameStateController.saveGame).toHaveBeenCalledWith('test', expect.objectContaining({
            active_player_index: 1
        }));
        expect(result.players[0].board_data).toBe(deployBoard);
    });
})
