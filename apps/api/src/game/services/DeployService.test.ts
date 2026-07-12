import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { Board, GameState } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
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

    it('rejects deploy boards with invalid ship markers', async () => {
        const invalidBoard: Board = createBoard();
        for (let row = 0; row < 2; row++) {
            for (let column = 0; column < 10; column++) {
                if ((row * 10) + column < 17) {
                    invalidBoard[row][column] = 'X';
                }
            }
        }

        mockGameStateController.getGame.mockResolvedValueOnce(createTestGame());

        await expect(
            deployService.deployCommand('test', invalidBoard)
        ).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('saves valid boards with exact ship marker counts', async () => {
        const validBoard = createValidDeployBoard();
        const gameState: GameState = createTestGame();
        let savedGameState: GameState | undefined;
        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementationOnce(async () => savedGameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, state: GameState) => {
            savedGameState = state;
            return state;
        });

        const result = await deployService.deployCommand('test', validBoard);

        expect(mockGameStateController.saveGame).toHaveBeenCalledTimes(1);
        expect(result.players[0].board_data).toBe(validBoard);
        expect(result.active_player_index).toBe(1);
        expect(result.phase).toBe('deploy');
    });
});

function createValidDeployBoard(): Board {
    const board: Board = createBoard();
    board[0].splice(0, 5, 'A', 'A', 'A', 'A', 'A');
    board[1].splice(0, 4, 'B', 'B', 'B', 'B');
    board[2].splice(0, 3, 'C', 'C', 'C');
    board[3].splice(0, 3, 'S', 'S', 'S');
    board[4].splice(0, 2, 'D', 'D');
    return board;
}
