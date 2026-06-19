import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { Attack } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, it, expect, beforeEach, jest } from "@jest/globals"


describe('Attack Service Test', () => {

    let mockGameStateController: any;
    let attackService: AttackService;

    beforeEach(() => {
        mockGameStateController = {
            updateGame: jest.fn()
        };
        attackService = new AttackService(mockGameStateController);
    });

    it('should throw an error if the game is not in the play phase', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [0, 0]
        };

        const gameState = createTestGame();
        gameState.phase = 'deploy';
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID, update) => update(gameState));

        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
    });

    it('records a miss in attack data so the coordinate cannot be attacked again', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [2, 3]
        };
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.turn = 1;
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID, update) => update(gameState));

        const updatedGameState = await attackService.attackCommand(gameID, attack);

        expect(updatedGameState.players[0].attack_data[2][3]).toBe('M');
        expect(updatedGameState.players[0].last_attack).toEqual({
            position: [2, 3],
            result: 'miss',
            target: 'O'
        });
        expect(updatedGameState.active_player_index).toBe(1);
        expect(updatedGameState.turn).toBe(2);
    });

    it('rejects repeat attacks against a missed coordinate', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [2, 3]
        };
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[0].attack_data[2][3] = 'M';
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID, update) => update(gameState));

        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
    });

    it('rejects malformed attacks before updating the game', async () => {
        await expect(attackService.attackCommand('test', {} as Attack)).rejects.toThrow(AttackError);

        expect(mockGameStateController.updateGame).not.toHaveBeenCalled();
    });

    it('rejects invalid defender markers instead of crashing ship updates', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [1, 1]
        };
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[1].board_data[1][1] = 'X';
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID, update) => update(gameState));

        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
    });
})