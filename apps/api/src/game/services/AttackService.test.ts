import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { GameState, Attack } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, expect, beforeEach } from "@jest/globals"


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

    it('should initialize missing last attack data before saving an attack', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [0, 0]
        };
        const gameState: GameState = {
            ...createTestGame(),
            phase: 'play'
        };
        gameState.players[0].last_attack = null as any;
        const savedGameState: GameState = {
            ...gameState,
            turn: 1,
            active_player_index: 1,
            players: [
                {
                    ...gameState.players[0],
                    last_attack: {
                        position: [0, 0],
                        result: 'miss',
                        target: 'O'
                    }
                },
                gameState.players[1]
            ]
        };

        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockResolvedValueOnce(savedGameState);
        mockGameStateController.saveGame.mockResolvedValueOnce(savedGameState);

        const result = await attackService.attackCommand(gameID, attack);

        expect(mockGameStateController.saveGame).toHaveBeenCalledWith(gameID, expect.objectContaining({
            players: expect.arrayContaining([
                expect.objectContaining({
                    last_attack: {
                        position: [0, 0],
                        result: 'miss',
                        target: 'O'
                    }
                })
            ])
        }));
        expect(result.players[0].last_attack).toEqual({
            position: [0, 0],
            result: 'miss',
            target: 'O'
        });
    });
})