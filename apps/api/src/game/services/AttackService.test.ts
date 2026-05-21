import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { GameState, Attack } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, test, expect, beforeEach, jest } from "@jest/globals"


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

    it('should persist misses in attack data', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [2, 3]
        };
        const gameState = createTestGame();
        gameState.phase = 'play';
        let savedGameState: GameState;

        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementationOnce(async () => savedGameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, state: GameState) => {
            savedGameState = state;
            return state;
        });

        const result = await attackService.attackCommand(gameID, attack);

        expect(result.players[0].attack_data[2][3]).toBe('M');
        expect(result.players[0].attack_data[0][3]).toBe('O');
        expect(result.players[0].last_attack).toEqual({
            position: [2, 3],
            result: 'miss',
            target: 'O'
        });
    });

    it('should reject a repeated attack after a miss', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [4, 5]
        };
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[0].attack_data[4][5] = 'M';

        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should handle nullable persisted last attack values', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [1, 1]
        };
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[0].last_attack = null as any;
        gameState.players[1].board_data[1][1] = 'A';
        let savedGameState: GameState;

        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementationOnce(async () => savedGameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, state: GameState) => {
            savedGameState = state;
            return state;
        });

        const result = await attackService.attackCommand(gameID, attack);

        expect(result.players[0].last_attack).toEqual({
            position: [1, 1],
            result: 'hit',
            target: 'A'
        });
        expect(result.players[1].ship_data[0].hits).toBe(1);
    });

    it('should reject malformed attack positions', async () => {
        const gameID = 'test';
        const attack = {
            position: undefined
        };
        const gameState = createTestGame();
        gameState.phase = 'play';

        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, attack as any)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject invalid persisted target markers without crashing', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [1, 1]
        };
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[1].board_data[1][1] = 'X';

        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})