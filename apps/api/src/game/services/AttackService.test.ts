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

    function mockPersistedGame(gameState: GameState): void {
        let savedGameState: GameState | undefined;
        mockGameStateController.getGame.mockImplementation(async () => savedGameState ?? gameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, nextGameState: GameState) => {
            savedGameState = nextGameState;
            return nextGameState;
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

    it('should mark misses in attack data so the same coordinate cannot be attacked again', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        gameState.phase = 'play';
        const attack: Attack = {
            position: [0, 0]
        };
        mockPersistedGame(gameState);

        const result = await attackService.attackCommand(gameID, attack);

        expect(result.players[0].attack_data[0][0]).toBe('M');
        expect(result.players[0].last_attack).toEqual({
            position: [0, 0],
            result: 'miss',
            target: 'O'
        });
    });

    it('should only mark the attacked coordinate on a hit', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[1].board_data[0][0] = 'A';
        const attack: Attack = {
            position: [0, 0]
        };
        mockPersistedGame(gameState);

        const result = await attackService.attackCommand(gameID, attack);

        expect(result.players[0].attack_data[0][0]).toBe('H');
        expect(result.players[0].attack_data[1][0]).toBe('O');
        expect(result.players[1].ship_data[0].hits).toBe(1);
    });
})