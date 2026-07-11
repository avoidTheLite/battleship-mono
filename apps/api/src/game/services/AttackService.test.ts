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

    it('should persist missed attacks in the attacker attack data', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [4, 6]
        };
        const gameState: GameState = {
            ...createTestGame(),
            phase: 'play'
        };

        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockResolvedValueOnce(gameState);
        mockGameStateController.saveGame.mockImplementationOnce(async (_gameID: string, savedGameState: GameState) => savedGameState);

        await attackService.attackCommand(gameID, attack);

        const savedGameState = mockGameStateController.saveGame.mock.calls[0][1] as GameState;
        expect(savedGameState.players[0].attack_data[4][6]).toBe('M');
        expect(savedGameState.players[0].last_attack).toEqual({
            position: [4, 6],
            result: 'miss',
            target: 'O'
        });
    });
})