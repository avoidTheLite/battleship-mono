import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { GameState, Attack } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, it, expect, beforeEach, jest } from "@jest/globals"


describe('Attack Service Test', () => {

    let mockGameStateController: any;
    let attackService: AttackService;
    let persistedGame: GameState;

    beforeEach(() => {
        persistedGame = createTestGame();
        persistedGame.phase = 'play';
        mockGameStateController = {
            getGame: jest.fn(async () => persistedGame),
            saveGame: jest.fn(async (_gameID: string, gameState: GameState) => {
                persistedGame = gameState;
                return gameState;
            })
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

    it('should persist misses on the attacker attack board', async () => {
        const attack: Attack = {
            position: [0, 0]
        };

        const gameState = await attackService.attackCommand('test', attack);

        expect(gameState.players[0].attack_data[0][0]).toBe('M');
        expect(gameState.players[0].attack_data[1][0]).toBe('O');
        expect(gameState.players[0].last_attack).toEqual({
            position: [0, 0],
            result: 'miss',
            target: 'O'
        });
        expect(gameState.active_player_index).toBe(1);
    });

    it('should update hit data for a valid ship target', async () => {
        persistedGame.players[1].board_data[0][0] = 'D';
        const attack: Attack = {
            position: [0, 0]
        };

        const gameState = await attackService.attackCommand('test', attack);

        expect(gameState.players[0].attack_data[0][0]).toBe('H');
        expect(gameState.players[1].ship_data.find((ship) => ship.key === 'D')?.hits).toBe(1);
        expect(gameState.players[0].last_attack).toEqual({
            position: [0, 0],
            result: 'hit',
            target: 'D'
        });
    });

    it('should reject malformed attack payloads without saving', async () => {
        const attack = {
            position: [0, 0, 0]
        } as unknown as Attack;

        await expect(attackService.attackCommand('test', attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject invalid defender board markers without saving corrupted state', async () => {
        persistedGame.players[1].board_data[0][0] = 'X';
        const attack: Attack = {
            position: [0, 0]
        };

        await expect(attackService.attackCommand('test', attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})