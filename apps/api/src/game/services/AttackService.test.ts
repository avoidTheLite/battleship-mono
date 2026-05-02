import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { GameState, Attack } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, test, expect, beforeEach } from "@jest/globals"


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

    it('should persist misses to the attacking player attack board', async () => {
        const gameID = 'test';
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        gameState.turn = 1;

        mockGameStateController.getGame.mockResolvedValueOnce(gameState).mockImplementation(async () => gameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, savedGameState: GameState) => savedGameState);

        await attackService.attackCommand(gameID, { position: [0, 0] });

        expect(gameState.players[0].attack_data[0][0]).toBe('M');
        expect(gameState.players[0].attack_data[1][0]).toBe('O');
        expect(gameState.players[0].last_attack).toEqual({
            position: [0, 0],
            result: 'miss',
            target: 'O'
        });
        expect(mockGameStateController.saveGame).toHaveBeenCalledWith(gameID, expect.objectContaining({
            active_player_index: 1,
            turn: 2
        }));
    });

    it('should reject repeating a missed coordinate', async () => {
        const gameID = 'test';
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[0].attack_data[0][0] = 'M';

        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, { position: [0, 0] })).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})