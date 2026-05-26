import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { Attack, GameState } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, expect, beforeEach, jest } from "@jest/globals"


describe('Attack Service Test', () => {

    let mockGameStateController: any;
    let attackService: AttackService;
    let gameState: GameState;

    beforeEach(() => {
        gameState = createTestGame();
        gameState.phase = 'play';
        gameState.turn = 1;
        gameState.active_player_index = 0;
        mockGameStateController = {
            getGame: jest.fn(),
            saveGame: jest.fn()
        };
        mockGameStateController.getGame.mockResolvedValue(gameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, updatedGameState: GameState) => updatedGameState);
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

    it('records misses in attack data so the same square cannot be replayed', async () => {
        const attack: Attack = {
            position: [2, 3]
        };

        await attackService.attackCommand('test', attack);

        const savedGameState = mockGameStateController.saveGame.mock.calls[0][1] as GameState;
        expect(savedGameState.players[0].attack_data[2][3]).toBe('M');
        expect(savedGameState.players[0].last_attack).toEqual({
            position: [2, 3],
            result: 'miss',
            target: 'O',
        });
    });

    it('rejects attacks against a previously missed square', async () => {
        gameState.players[0].attack_data[2][3] = 'M';
        const attack: Attack = {
            position: [2, 3]
        };

        await expect(attackService.attackCommand('test', attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('normalizes null last attack data before applying an attack', async () => {
        gameState.players[0].last_attack = null;
        const attack: Attack = {
            position: [4, 4]
        };

        await expect(attackService.attackCommand('test', attack)).resolves.toEqual(expect.any(Object));

        const savedGameState = mockGameStateController.saveGame.mock.calls[0][1] as GameState;
        expect(savedGameState.players[0].last_attack).toEqual({
            position: [4, 4],
            result: 'miss',
            target: 'O',
        });
    });

    it('rejects malformed attack coordinates before indexing the board', async () => {
        const attack = {
            position: [1.5, 4]
        } as Attack;

        await expect(attackService.attackCommand('test', attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('rejects attacks with a missing position without throwing a TypeError', async () => {
        const attack = {} as Attack;

        await expect(attackService.attackCommand('test', attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('throws a controlled attack error for invalid persisted ship markers', async () => {
        gameState.players[1].board_data[5][5] = 'X';
        const attack: Attack = {
            position: [5, 5]
        };

        await expect(attackService.attackCommand('test', attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})