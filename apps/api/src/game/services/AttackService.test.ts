import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { GameState, Attack } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, test, expect, beforeEach, jest } from "@jest/globals";


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

    test('should throw an error if the game is not in the play phase', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [0, 0]
        };

        mockGameStateController.getGame.mockResolvedValueOnce({
            phase: 'deploy'
        });
        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
    });

    test('records a miss in the attacking player attack data', async () => {
        const gameID = 'test';
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        const attack: Attack = {
            position: [9, 9]
        };

        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementation(() => Promise.resolve(gameState));
        mockGameStateController.saveGame.mockImplementation((_gameID: string, savedGameState: GameState) => {
            Object.assign(gameState, savedGameState);
            return Promise.resolve(savedGameState);
        });

        const result = await attackService.attackCommand(gameID, attack);

        expect(result.players[0].attack_data[9][9]).toBe('M');
        expect(result.players[0].last_attack).toEqual({
            position: [9, 9],
            result: 'miss',
            target: 'O'
        });
    });

    test('rejects malformed attacks instead of crashing', async () => {
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand('test', {} as Attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    test('rejects invalid defender board markers instead of corrupting ship data', async () => {
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[1].board_data[0][0] = 'X';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand('test', { position: [0, 0] })).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})