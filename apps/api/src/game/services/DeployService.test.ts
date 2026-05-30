import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import DeployService from "./DeployService.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { Board, GameState } from "../../common/types/types.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";

function boardWithMarkers(marker: string, markerCount: number): Board {
    const board = createBoard();
    for (let i = 0; i < markerCount; i++) {
        const row = Math.floor(i / 10);
        const column = i % 10;
        board[row][column] = marker;
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

    it('should reject boards with invalid ship markers even when occupied count is correct', async () => {
        const gameState: GameState = createTestGame();
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand('test', boardWithMarkers('X', 17))).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject boards missing the exact fleet composition', async () => {
        const gameState: GameState = createTestGame();
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand('test', boardWithMarkers('A', 17))).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
});
