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

    it('records a missed attack in the attacker attack data', async () => {
        const gameID = 'test';
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        const attack: Attack = {
            position: [0, 0]
        };
        mockGameStateController.getGame.mockResolvedValue(gameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, savedGameState: GameState) => savedGameState);

        await attackService.attackCommand(gameID, attack);

        const savedGameState = mockGameStateController.saveGame.mock.calls[0][1] as GameState;
        expect(savedGameState.players[0].attack_data[0][0]).toBe('M');
        expect(savedGameState.players[0].attack_data[1][0]).toBe('O');
        expect(savedGameState.players[0].last_attack).toEqual({
            position: [0, 0],
            result: 'miss',
            target: 'O'
        });
        expect(savedGameState.active_player_index).toBe(1);
    });

    it('rejects malformed attacks before indexing board state', async () => {
        const gameID = 'test';
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        mockGameStateController.getGame.mockResolvedValue(gameState);

        await expect(attackService.attackCommand(gameID, { position: [0] } as unknown as Attack)).rejects.toThrow(AttackError);

        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('rejects invalid defender board markers without mutating game state', async () => {
        const gameID = 'test';
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[1].board_data[0][0] = 'X';
        const attack: Attack = {
            position: [0, 0]
        };
        mockGameStateController.getGame.mockResolvedValue(gameState);

        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);

        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})