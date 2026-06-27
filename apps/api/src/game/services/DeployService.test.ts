import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import type { Board, GameState } from "../../common/types/types.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { DeployError } from "../../common/types/errors.ts";
import DeployService from "./DeployService.ts";

describe('DeployService', () => {
    let mockGameStateController: any;
    let deployService: DeployService;

    beforeEach(() => {
        mockGameStateController = {
            updateGame: jest.fn()
        };
        deployService = new DeployService(mockGameStateController);
    });

    function mockGameUpdate(gameState: GameState) {
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID: string, update) => update(gameState));
    }

    function createValidDeploymentBoard(): Board {
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

    it('accepts a board with the expected ship markers', async () => {
        const gameState = createTestGame();
        mockGameUpdate(gameState);

        const result = await deployService.deployCommand('test', createValidDeploymentBoard());

        expect(result.players[0].board_data[0][0]).toBe('A');
        expect(result.active_player_index).toBe(1);
        expect(result.phase).toBe('deploy');
    });

    it('rejects boards with invalid ship markers', async () => {
        const gameState = createTestGame();
        const board = createBoard();
        for (let i = 0; i < 17; i++) {
            board[Math.floor(i / 10)][i % 10] = 'X';
        }
        mockGameUpdate(gameState);

        await expect(deployService.deployCommand('test', board)).rejects.toThrow(DeployError);
    });

    it('rejects malformed board shapes before indexing', async () => {
        const gameState = createTestGame();
        const board = createBoard().slice(0, 9) as unknown as Board;
        mockGameUpdate(gameState);

        await expect(deployService.deployCommand('test', board)).rejects.toThrow(DeployError);
    });
});
