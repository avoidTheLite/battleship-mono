import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { Attack, GameState } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
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

    it('marks a miss in attack data so the same square cannot be attacked again', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        gameState.phase = 'play';
        let savedGameState: GameState | undefined;

        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementationOnce(async () => savedGameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, state: GameState) => {
            savedGameState = state;
            return state;
        });

        const result = await attackService.attackCommand(gameID, { position: [1, 1] });

        expect(result.players[0].attack_data[1][1]).toBe('M');
        expect(result.players[0].last_attack).toEqual({
            position: [1, 1],
            result: 'miss',
            target: 'O'
        });
    });

    it('rejects a repeated attack against a missed square', async () => {
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[0].attack_data[1][1] = 'M';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand('test', { position: [1, 1] })).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('handles a nullable last attack when resolving the next attack', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[0].last_attack = null;
        let savedGameState: GameState | undefined;

        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementationOnce(async () => savedGameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, state: GameState) => {
            savedGameState = state;
            return state;
        });

        await expect(attackService.attackCommand(gameID, { position: [2, 2] })).resolves.toBeDefined();
        expect(savedGameState?.players[0].last_attack.position).toEqual([2, 2]);
    });

    it('rejects malformed attacks before reading coordinates', async () => {
        const gameState = createTestGame();
        gameState.phase = 'play';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand('test', {} as Attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})