import DeployService from "./DeployService.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { Board, GameState } from "../../common/types/types.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";

describe('Deploy Service Test', () => {
    let mockGameStateController: any;
    let deployService: DeployService;
    let savedGameState: GameState;

    beforeEach(() => {
        mockGameStateController = {
            getGame: jest.fn(),
            saveGame: jest.fn()
        };
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, gameState: GameState) => {
            savedGameState = gameState;
            return gameState;
        });
        deployService = new DeployService(mockGameStateController);
    });

    it('should reject boards with invalid ship markers', async () => {
        const gameState = createTestGame();
        const deployBoard = createBoard();
        deployBoard[0][0] = 'X';
        deployBoard[0][1] = 'X';
        deployBoard[0][2] = 'X';
        deployBoard[0][3] = 'X';
        deployBoard[0][4] = 'X';
        deployBoard[1][0] = 'X';
        deployBoard[1][1] = 'X';
        deployBoard[1][2] = 'X';
        deployBoard[1][3] = 'X';
        deployBoard[2][0] = 'X';
        deployBoard[2][1] = 'X';
        deployBoard[2][2] = 'X';
        deployBoard[3][0] = 'X';
        deployBoard[3][1] = 'X';
        deployBoard[3][2] = 'X';
        deployBoard[4][0] = 'X';
        deployBoard[4][1] = 'X';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand('test', deployBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should accept a board with the expected ship keys and counts', async () => {
        const gameState = createTestGame();
        const deployBoard = createBoard();
        deployBoard[0][0] = 'A';
        deployBoard[0][1] = 'A';
        deployBoard[0][2] = 'A';
        deployBoard[0][3] = 'A';
        deployBoard[0][4] = 'A';
        deployBoard[1][0] = 'B';
        deployBoard[1][1] = 'B';
        deployBoard[1][2] = 'B';
        deployBoard[1][3] = 'B';
        deployBoard[2][0] = 'C';
        deployBoard[2][1] = 'C';
        deployBoard[2][2] = 'C';
        deployBoard[3][0] = 'S';
        deployBoard[3][1] = 'S';
        deployBoard[3][2] = 'S';
        deployBoard[4][0] = 'D';
        deployBoard[4][1] = 'D';
        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementationOnce(async () => savedGameState);

        const result = await deployService.deployCommand('test', deployBoard as Board);

        expect(result.players[0].board_data).toBe(deployBoard);
        expect(result.active_player_index).toBe(1);
    });
});
