import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { GameState, Attack } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, expect, beforeEach, it, jest } from "@jest/globals"


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

    it('should persist missed attacks so the same position cannot be replayed', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [2, 3]
        };
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        let savedGameState: GameState | undefined;

        mockGameStateController.getGame.mockImplementation(async () => savedGameState ?? gameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, state: GameState) => {
            savedGameState = state;
            return state;
        });

        const result = await attackService.attackCommand(gameID, attack);

        expect(result.players[0].attack_data[2][3]).toBe('M');
        expect(result.players[0].last_attack).toEqual({
            position: [2, 3],
            result: 'miss',
            target: 'O'
        });
        expect(result.active_player_index).toBe(1);
    });

    it('should initialize nullable persisted last attack records before attacking', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [4, 5]
        };
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[0].last_attack = null as any;
        let savedGameState: GameState | undefined;

        mockGameStateController.getGame.mockImplementation(async () => savedGameState ?? gameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, state: GameState) => {
            savedGameState = state;
            return state;
        });

        const result = await attackService.attackCommand(gameID, attack);

        expect(result.players[0].last_attack).toEqual({
            position: [4, 5],
            result: 'miss',
            target: 'O'
        });
    });

    it('should reject corrupt defender board markers instead of crashing during a hit', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [0, 0]
        };
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[1].board_data[0][0] = 'Z';

        mockGameStateController.getGame.mockResolvedValue(gameState);

        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})