import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import DeployService from "./DeployService.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { Board } from "../../common/types/types.ts";
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

    test('rejects deployments with invalid ship markers', async () => {
        const invalidBoard: Board = createBoard();
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                if ((i * 10) + j < 17) {
                    invalidBoard[i][j] = 'X';
                }
            }
        }

        mockGameStateController.getGame.mockResolvedValueOnce(createTestGame());

        await expect(deployService.deployCommand('test', invalidBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    test('rejects deployments with incorrect ship counts', async () => {
        const invalidBoard: Board = createBoard();
        invalidBoard[0][0] = 'A';
        invalidBoard[0][1] = 'A';
        invalidBoard[0][2] = 'A';
        invalidBoard[0][3] = 'A';
        invalidBoard[0][4] = 'A';
        invalidBoard[1][0] = 'B';
        invalidBoard[1][1] = 'B';
        invalidBoard[1][2] = 'B';
        invalidBoard[1][3] = 'B';
        invalidBoard[2][0] = 'C';
        invalidBoard[2][1] = 'C';
        invalidBoard[2][2] = 'C';
        invalidBoard[3][0] = 'S';
        invalidBoard[3][1] = 'S';
        invalidBoard[3][2] = 'S';
        invalidBoard[4][0] = 'D';

        mockGameStateController.getGame.mockResolvedValueOnce(createTestGame());

        await expect(deployService.deployCommand('test', invalidBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
});
