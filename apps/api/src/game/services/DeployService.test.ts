import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import DeployService from "./DeployService.ts";
import { DeployError } from "../../common/types/errors.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import type { Board } from "../../common/types/types.ts";

function placeCells(board: Board, marker: string, coordinates: Array<[number, number]>): void {
    coordinates.forEach(([row, column]) => {
        board[row][column] = marker;
    });
}

function createValidDeploymentBoard(): Board {
    const board = createBoard();
    placeCells(board, 'A', [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]);
    placeCells(board, 'B', [[1, 0], [1, 1], [1, 2], [1, 3]]);
    placeCells(board, 'C', [[2, 0], [2, 1], [2, 2]]);
    placeCells(board, 'S', [[3, 0], [3, 1], [3, 2]]);
    placeCells(board, 'D', [[4, 0], [4, 1]]);
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

    it('should reject boards with unknown ship markers even when occupied cell count is 17', async () => {
        const invalidBoard = createBoard();
        for (let row = 0, placed = 0; row < 10 && placed < 17; row++) {
            for (let column = 0; column < 10 && placed < 17; column++, placed++) {
                invalidBoard[row][column] = 'X';
            }
        }
        mockGameStateController.getGame.mockResolvedValueOnce(createTestGame());

        await expect(deployService.deployCommand('test', invalidBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject boards with incorrect ship counts', async () => {
        const invalidBoard = createValidDeploymentBoard();
        invalidBoard[0][0] = 'O';
        invalidBoard[9][9] = 'D';
        mockGameStateController.getGame.mockResolvedValueOnce(createTestGame());

        await expect(deployService.deployCommand('test', invalidBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
});
