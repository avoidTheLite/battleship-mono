import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import type { Board, GameState } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import DeployService from "./DeployService.ts";

describe('DeployService', () => {
    let mockGameStateController: any;
    let deployService: DeployService;

    beforeEach(() => {
        mockGameStateController = {
            getGame: jest.fn(),
            saveGame: jest.fn()
        };
        deployService = new DeployService(mockGameStateController);
    });

    function createValidDeployBoard(): Board {
        return [
            ['A', 'A', 'A', 'A', 'A', 'O', 'O', 'O', 'O', 'O'],
            ['B', 'B', 'B', 'B', 'O', 'O', 'O', 'O', 'O', 'O'],
            ['C', 'C', 'C', 'O', 'O', 'O', 'O', 'O', 'O', 'O'],
            ['S', 'S', 'S', 'O', 'O', 'O', 'O', 'O', 'O', 'O'],
            ['D', 'D', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'],
            ['O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'],
            ['O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'],
            ['O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'],
            ['O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'],
            ['O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'],
        ];
    }

    it('should reject boards with invalid ship markers even when they have 17 occupied squares', async () => {
        const gameState: GameState = createTestGame();
        const invalidBoard = createValidDeployBoard();
        invalidBoard[0][0] = 'X';
        invalidBoard[5][0] = 'A';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand('test', invalidBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should save valid ship counts', async () => {
        const gameState: GameState = createTestGame();
        const validBoard = createValidDeployBoard();
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, state: GameState) => state);
        mockGameStateController.getGame.mockResolvedValueOnce({
            ...gameState,
            players: [
                {
                    ...gameState.players[0],
                    board_data: validBoard,
                },
                gameState.players[1],
            ],
        });

        const result = await deployService.deployCommand('test', validBoard);

        expect(result.players[0].board_data).toBe(validBoard);
    });
});
