import { describe, expect, beforeEach, jest, it } from "@jest/globals";
import DeployService from "./DeployService.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { Board, GameState } from "../../common/types/types.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";

const SHIP_COUNTS: Array<[string, number]> = [
    ['A', 5],
    ['B', 4],
    ['C', 3],
    ['S', 3],
    ['D', 2],
];

function createValidDeployBoard(): Board {
    const board = createBoard();
    let row = 0;
    let column = 0;
    for (const [shipKey, count] of SHIP_COUNTS) {
        for (let i = 0; i < count; i++) {
            board[row][column] = shipKey;
            column++;
            if (column === 10) {
                row++;
                column = 0;
            }
        }
    }
    return board;
}

describe('Deploy Service Test', () => {
    let mockGameStateController: any;
    let deployService: DeployService;
    let savedGameState: GameState;

    beforeEach(() => {
        mockGameStateController = {
            getGame: jest.fn(),
            saveGame: jest.fn((_gameID: string, gameState: GameState) => {
                savedGameState = gameState;
                return Promise.resolve(gameState);
            })
        };
        deployService = new DeployService(mockGameStateController);
    });

    it('accepts a board with the exact expected ship markers', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        const deployBoard = createValidDeployBoard();

        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementationOnce(() => Promise.resolve(savedGameState));

        const result = await deployService.deployCommand(gameID, deployBoard);

        expect(result.players[0].board_data).toBe(deployBoard);
        expect(result.active_player_index).toBe(1);
        expect(result.phase).toBe('deploy');
    });

    it('rejects unknown ship markers even when the occupied-cell count is correct', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        const deployBoard = createBoard();
        for (let i = 0; i < 17; i++) {
            deployBoard[Math.floor(i / 10)][i % 10] = 'X';
        }

        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand(gameID, deployBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('rejects boards with incorrect ship counts', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        const deployBoard = createValidDeployBoard();
        deployBoard[0][0] = 'B';

        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand(gameID, deployBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
});
