import DeployService from "./DeployService.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { Board, GameState } from "../../common/types/types.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";

function createValidDeployBoard(): Board {
    const board = createBoard();
    for (let column = 0; column < 5; column++) {
        board[0][column] = 'A';
    }
    for (let column = 0; column < 4; column++) {
        board[1][column] = 'B';
    }
    for (let column = 0; column < 3; column++) {
        board[2][column] = 'C';
        board[3][column] = 'S';
    }
    for (let column = 0; column < 2; column++) {
        board[4][column] = 'D';
    }
    return board;
}

function controllerForGame(gameState: GameState): any {
    return {
        getGame: jest.fn()
            .mockResolvedValueOnce(gameState)
            .mockImplementation(async () => gameState),
        saveGame: jest.fn(async (_gameID: string, nextGameState: GameState) => nextGameState)
    };
}

describe('Deploy Service Test', () => {
    let mockGameStateController: any;
    let deployService: DeployService;

    beforeEach(() => {
        const gameState = createTestGame();
        mockGameStateController = controllerForGame(gameState);
        deployService = new DeployService(mockGameStateController);
    });

    it('should reject deploy boards with unknown ship markers', async () => {
        const invalidBoard = createBoard();
        for (let column = 0; column < 10; column++) {
            invalidBoard[0][column] = 'X';
        }
        for (let column = 0; column < 7; column++) {
            invalidBoard[1][column] = 'X';
        }

        await expect(deployService.deployCommand('test', invalidBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should persist a board with the exact fleet composition', async () => {
        const validBoard = createValidDeployBoard();

        await deployService.deployCommand('test', validBoard);
        const savedGameState = mockGameStateController.saveGame.mock.calls[0][1] as GameState;

        expect(savedGameState.players[0].board_data).toBe(validBoard);
        expect(savedGameState.active_player_index).toBe(1);
        expect(savedGameState.phase).toBe('deploy');
    });
});
