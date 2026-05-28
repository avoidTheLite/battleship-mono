import { describe, expect, beforeEach, it, jest } from "@jest/globals"
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
            getGame: jest.fn(),
            saveGame: jest.fn()
        };
        deployService = new DeployService(mockGameStateController);
    });

    function validDeployBoard(): Board {
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

    it('rejects occupied cells that do not match a real ship key', async () => {
        const gameID = 'test';
        const invalidBoard = createBoard();
        for (let i = 0; i < 17; i++) {
            invalidBoard[Math.floor(i / 10)][i % 10] = 'X';
        }
        mockGameStateController.getGame.mockResolvedValueOnce(createTestGame());

        await expect(deployService.deployCommand(gameID, invalidBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('accepts a board with the exact expected ship inventory', async () => {
        const gameID = 'test';
        const gameState: GameState = createTestGame();
        const board = validDeployBoard();
        let savedGameState = gameState;
        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementationOnce(async () => savedGameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, nextGameState: GameState) => {
            savedGameState = nextGameState;
            return nextGameState;
        });

        const result = await deployService.deployCommand(gameID, board);

        expect(result.players[0].board_data).toBe(board);
        expect(result.active_player_index).toBe(1);
        expect(mockGameStateController.saveGame).toHaveBeenCalledTimes(1);
    });
})
