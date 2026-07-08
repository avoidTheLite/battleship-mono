import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { DeployError } from "../../common/types/errors.ts";
import type { Board, GameState } from "../../common/types/types.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import DeployService from "./DeployService.ts";

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

    it('rejects a board with unknown ship markers', async () => {
        const gameState: GameState = createTestGame();
        const deployBoard = createValidDeployBoard();
        deployBoard[0][0] = 'X';
        mockGameStateController.getGame.mockResolvedValue(gameState);

        await expect(deployService.deployCommand('test', deployBoard)).rejects.toThrow(DeployError);

        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('rejects malformed board shapes before indexing rows', async () => {
        const gameState: GameState = createTestGame();
        const deployBoard = createValidDeployBoard().slice(0, 9);
        mockGameStateController.getGame.mockResolvedValue(gameState);

        await expect(deployService.deployCommand('test', deployBoard as unknown as Board)).rejects.toThrow(DeployError);

        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
});
