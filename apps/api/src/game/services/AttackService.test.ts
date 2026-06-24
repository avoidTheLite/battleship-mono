import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { GameState, Attack } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, it, expect, beforeEach, jest } from "@jest/globals"


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
        let persistedGameState = gameState;
        mockGameStateController.getGame.mockImplementation(async () => persistedGameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, savedGameState: GameState) => {
            persistedGameState = savedGameState;
            return savedGameState;
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

    it('should persist missed attacks in attack data', async () => {
        const gameState = createTestGame();
        gameState.phase = 'play';
        mockPersistedGame(gameState);

        await attackService.attackCommand('test', { position: [0, 0] });

        expect(mockGameStateController.saveGame).toHaveBeenCalled();
        const savedGameState = mockGameStateController.saveGame.mock.calls[0][1] as GameState;
        expect(savedGameState.players[0].attack_data[0][0]).toBe('M');
        expect(savedGameState.players[0].last_attack).toEqual({
            position: [0, 0],
            result: 'miss',
            target: 'O'
        });
    });

    it('should reject repeated attacks against missed coordinates', async () => {
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[0].attack_data[0][0] = 'M';
        mockPersistedGame(gameState);

        await expect(attackService.attackCommand('test', { position: [0, 0] })).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject malformed attack positions without crashing', async () => {
        const gameState = createTestGame();
        gameState.phase = 'play';
        mockPersistedGame(gameState);

        await expect(attackService.attackCommand('test', {} as Attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject invalid defender board markers without crashing', async () => {
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[1].board_data[0][0] = 'X';
        mockPersistedGame(gameState);

        await expect(attackService.attackCommand('test', { position: [0, 0] })).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})