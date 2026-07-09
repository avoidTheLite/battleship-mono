import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { GameState, Attack } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, test, expect, beforeEach, jest } from "@jest/globals"


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

    test('records missed attacks in attack data', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [4, 4]
        };
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';

        mockGameStateController.getGame.mockImplementation(async () => gameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, nextState: GameState) => nextState);

        await attackService.attackCommand(gameID, attack);

        const savedGameState: GameState = mockGameStateController.saveGame.mock.calls[0][1];
        expect(savedGameState.players[0].attack_data[4][4]).toBe('M');
        expect(savedGameState.players[0].last_attack).toEqual({
            position: [4, 4],
            result: 'miss',
            target: 'O'
        });
    });

    test('rejects locations previously recorded as misses', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [3, 3]
        };
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[0].attack_data[3][3] = 'M';

        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})