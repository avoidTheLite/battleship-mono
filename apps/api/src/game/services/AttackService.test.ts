import AttackService from "./AttackService.ts";
import DeployService from "./DeployService.ts";
import { AttackError, DeployError } from "../../common/types/errors.ts";
import type { Attack } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import createBoard from "../../common/util/createBoard.ts";
import { describe, expect, beforeEach, jest } from "@jest/globals"


describe('Attack Service Test', () => {

    let mockGameStateController: any;
    let attackService: AttackService;

    beforeEach(() => {
        mockGameStateController = {
            getGame: jest.fn(),
            saveGame: jest.fn()
        };
        attackService = new AttackService(mockGameStateController);
    });

    it('should throw an error if the game is not in the play phase', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [0, 0]
        };

        mockGameStateController.getGame.mockResolvedValueOnce({
            phase: 'deploy'
        });
        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
    });

    it('records missed attacks so the same coordinate cannot be attacked again', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.active_player_index = 0;
        gameState.players[0].last_attack = null;

        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockResolvedValueOnce(gameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID, savedGameState) => savedGameState);

        await attackService.attackCommand(gameID, { position: [0, 0] });

        expect(mockGameStateController.saveGame).toHaveBeenCalledTimes(1);
        const savedGameState = mockGameStateController.saveGame.mock.calls[0][1];
        expect(savedGameState.players[0].attack_data[0][0]).toBe('M');
        expect(savedGameState.players[0].last_attack).toEqual({
            position: [0, 0],
            result: 'miss',
            target: 'O'
        });

        savedGameState.active_player_index = 0;
        mockGameStateController.getGame.mockResolvedValueOnce(savedGameState);
        await expect(attackService.attackCommand(gameID, { position: [0, 0] })).rejects.toThrow(AttackError);
    });

    it('rejects invalid target markers without crashing while resolving an attack', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[1].board_data[0][0] = 'X';

        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, { position: [0, 0] })).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
});

describe('Deploy Service Test', () => {
    it('rejects boards with invalid ship markers even when 17 cells are occupied', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        const deployBoard = createBoard();
        const mockGameStateController: any = {
            getGame: jest.fn().mockResolvedValueOnce(gameState),
            saveGame: jest.fn()
        };
        const deployService = new DeployService(mockGameStateController);

        for (let i = 0; i < 17; i++) {
            deployBoard[Math.floor(i / 10)][i % 10] = 'X';
        }

        await expect(deployService.deployCommand(gameID, deployBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
});

describe('createBoard', () => {
    it('creates independent row arrays', () => {
        const board = createBoard();

        board[0][0] = 'M';

        expect(board[1][0]).toBe('O');
    });
})