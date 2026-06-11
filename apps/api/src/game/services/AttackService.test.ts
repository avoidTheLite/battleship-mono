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
            updateGame: jest.fn()
        };
        attackService = new AttackService(mockGameStateController);
    });

    function mockUpdateGameWith(gameState: GameState): void {
        mockGameStateController.updateGame.mockImplementation(async (_gameID: string, updateGameState: (gameState: GameState) => GameState) => {
            return updateGameState(gameState);
        });
    }

    it('should throw an error if the game is not in the play phase', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [0, 0]
        };

        mockUpdateGameWith(createTestGame());
        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
    });

    it('records a miss so the same coordinate cannot be attacked again', async () => {
        const gameState = createTestGame();
        gameState.phase = 'play';
        mockUpdateGameWith(gameState);

        const updatedGameState = await attackService.attackCommand('test', { position: [0, 0] });

        expect(updatedGameState.players[0].attack_data[0][0]).toBe('M');
        expect(updatedGameState.players[0].last_attack).toEqual({
            position: [0, 0],
            result: 'miss',
            target: 'O'
        });
        expect(updatedGameState.active_player_index).toBe(1);
        expect(updatedGameState.turn).toBe(1);
    });

    it('rejects a repeated miss marker before mutating turn state', async () => {
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[0].attack_data[2][2] = 'M';
        mockUpdateGameWith(gameState);

        await expect(attackService.attackCommand('test', { position: [2, 2] })).rejects.toThrow(AttackError);
        expect(gameState.active_player_index).toBe(0);
        expect(gameState.turn).toBe(0);
    });

    it('rejects malformed attack coordinates without entering the update transaction', async () => {
        await expect(attackService.attackCommand('test', {} as Attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.updateGame).not.toHaveBeenCalled();
    });

    it('rejects invalid defender board markers instead of indexing missing ship data', async () => {
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[1].board_data[0][0] = 'X';
        mockUpdateGameWith(gameState);

        await expect(attackService.attackCommand('test', { position: [0, 0] })).rejects.toThrow(AttackError);
    });
})