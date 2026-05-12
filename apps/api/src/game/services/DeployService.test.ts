import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import DeployService from "./DeployService.ts";
import { DeployError } from "../../common/types/errors.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import createBoard from "../../common/util/createBoard.ts";

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

    it('should reject boards with unknown ship keys even when 17 cells are occupied', async () => {
        const gameState = createTestGame();
        const invalidBoard = createBoard();
        let occupiedCells = 0;
        for (let row = 0; row < 10 && occupiedCells < 17; row++) {
            for (let column = 0; column < 10 && occupiedCells < 17; column++) {
                invalidBoard[row][column] = 'Z';
                occupiedCells++;
            }
        }
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand('test', invalidBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject malformed boards before mutating the active player', async () => {
        const gameState = createTestGame();
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand('test', [['A']])).rejects.toThrow(DeployError);
        expect(gameState.players[0].board_data).toEqual(createBoard());
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})
