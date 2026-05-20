import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { GameState, Attack } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { beforeEach, describe, expect, it, jest } from "@jest/globals"


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

    function useGameState(gameState: GameState) {
        mockGameStateController.currentGame = gameState;
        mockGameStateController.getGame.mockImplementation(async () => mockGameStateController.currentGame);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, savedGameState: GameState) => {
            mockGameStateController.currentGame = savedGameState;
            return savedGameState;
        });
    }

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

    it('persists misses so the same coordinate cannot be replayed', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [2, 3]
        };
        const gameState = createTestGame();
        gameState.phase = 'play';
        useGameState(gameState);

        const result = await attackService.attackCommand(gameID, attack);

        expect(result.players[0].attack_data[2][3]).toBe('M');
        expect(result.players[0].last_attack).toEqual({
            position: [2, 3],
            result: 'miss',
            target: 'O'
        });
        expect(result.active_player_index).toBe(1);
    });

    it('normalizes null last_attack records before applying an attack', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [4, 4]
        };
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[0].last_attack = null;
        useGameState(gameState);

        const result = await attackService.attackCommand(gameID, attack);

        expect(result.players[0].last_attack).toEqual({
            position: [4, 4],
            result: 'miss',
            target: 'O'
        });
    });

    it('rejects malformed attack coordinates without crashing', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        gameState.phase = 'play';
        useGameState(gameState);

        await expect(attackService.attackCommand(gameID, { position: ['x', 1] } as unknown as Attack))
            .rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})