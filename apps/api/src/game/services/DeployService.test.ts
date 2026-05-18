import { describe, expect, beforeEach, it, jest } from "@jest/globals"
import DeployService from "./DeployService.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { Board, GameState } from "../../common/types/types.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";

function createValidDeployBoard(): Board {
    const board = createBoard();
    const placements: Array<[string, number]> = [
        ['A', 5],
        ['B', 4],
        ['C', 3],
        ['S', 3],
        ['D', 2]
    ];
    let column = 0;

    for (const [shipKey, size] of placements) {
        for (let row = 0; row < size; row++) {
            board[row][column] = shipKey;
        }
        column += 1;
    }

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

    it('should reject boards with unknown ship markers even when occupied count is 17', async () => {
        const gameState: GameState = createTestGame();
        const invalidBoard = createBoard();
        for (let i = 0; i < 17; i++) {
            invalidBoard[Math.floor(i / 10)][i % 10] = 'Z';
        }

        mockGameStateController.getGame.mockResolvedValue(gameState);

        await expect(deployService.deployCommand('test', invalidBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should accept boards with exactly the expected ship markers and counts', async () => {
        const gameState: GameState = createTestGame();
        const deployBoard = createValidDeployBoard();
        let savedGameState: GameState | undefined;

        mockGameStateController.getGame.mockImplementation(async () => savedGameState ?? gameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, state: GameState) => {
            savedGameState = state;
            return state;
        });

        const result = await deployService.deployCommand('test', deployBoard);

        expect(result.players[0].board_data).toBe(deployBoard);
        expect(result.active_player_index).toBe(1);
        expect(result.phase).toBe('deploy');
    });
});
