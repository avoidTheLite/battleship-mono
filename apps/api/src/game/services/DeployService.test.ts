import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Board, GameState } from "../../common/types/types.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { DeployError } from "../../common/types/errors.ts";
import DeployService from "./DeployService.ts";

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

    function useGameState(gameState: GameState) {
        mockGameStateController.currentGame = gameState;
        mockGameStateController.getGame.mockImplementation(async () => mockGameStateController.currentGame);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, savedGameState: GameState) => {
            mockGameStateController.currentGame = savedGameState;
            return savedGameState;
        });
    }

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

    it('rejects unknown ship markers that would later crash attacks', async () => {
        const gameState = createTestGame();
        const invalidBoard = createBoard();
        for (let row = 0; row < 10; row++) {
            for (let column = 0; column < 10 && row * 10 + column < 17; column++) {
                invalidBoard[row][column] = 'X';
            }
        }
        useGameState(gameState);

        await expect(deployService.deployCommand('test', invalidBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('requires the exact expected ship cell counts', async () => {
        const gameState = createTestGame();
        const invalidBoard = createValidDeployBoard();
        invalidBoard[4][1] = 'A';
        useGameState(gameState);

        await expect(deployService.deployCommand('test', invalidBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
});
