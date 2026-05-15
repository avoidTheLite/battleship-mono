import DeployService from "./DeployService.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { Board, GameState } from "../../common/types/types.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, it, expect, beforeEach } from "@jest/globals"

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

    it('should reject deployed boards with invalid ship markers', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        const deployBoard = createValidDeployBoard();
        deployBoard[4][1] = 'X';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand(gameID, deployBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should save valid deployments for the active player', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        const deployBoard = createValidDeployBoard();
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, updatedGameState: GameState) => updatedGameState);
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await deployService.deployCommand(gameID, deployBoard);

        const savedGameState = mockGameStateController.saveGame.mock.calls[0][1] as GameState;
        expect(savedGameState.players[0].board_data).toBe(deployBoard);
        expect(savedGameState.active_player_index).toBe(1);
        expect(savedGameState.phase).toBe('deploy');
    });
})
