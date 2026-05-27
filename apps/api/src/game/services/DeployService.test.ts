import { describe, expect, beforeEach, jest } from "@jest/globals";
import DeployService from "./DeployService.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { Board, GameState } from "../../common/types/types.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";

function createValidDeployBoard(): Board {
    const board = createBoard();
    board[0].splice(0, 5, 'A', 'A', 'A', 'A', 'A');
    board[1].splice(0, 4, 'B', 'B', 'B', 'B');
    board[2].splice(0, 3, 'C', 'C', 'C');
    board[3].splice(0, 3, 'S', 'S', 'S');
    board[4].splice(0, 2, 'D', 'D');
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

    it('rejects boards with unknown ship markers', async () => {
        const board = createBoard();
        for (let i = 0; i < 17; i++) {
            board[Math.floor(i / 10)][i % 10] = 'X';
        }
        mockGameStateController.getGame.mockResolvedValueOnce(createTestGame());

        await expect(deployService.deployCommand('test', board)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('rejects malformed board shapes without crashing', async () => {
        mockGameStateController.getGame.mockResolvedValueOnce(createTestGame());

        await expect(deployService.deployCommand('test', [] as unknown as Board)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('saves valid ship deployments', async () => {
        const gameID = 'test';
        let savedGameState: GameState | undefined;
        mockGameStateController.getGame
            .mockResolvedValueOnce(createTestGame())
            .mockImplementationOnce(async () => savedGameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, state: GameState) => {
            savedGameState = state;
            return state;
        });

        const board = createValidDeployBoard();
        const result = await deployService.deployCommand(gameID, board);

        expect(result.players[0].board_data).toEqual(board);
        expect(result.active_player_index).toBe(1);
    });
});
