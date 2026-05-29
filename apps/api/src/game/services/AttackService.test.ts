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

    it('should persist missed attacks in the attacker attack board', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.turn = 1;
        gameState.players[1].board_data[0][0] = 'O';
        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementation(async () => gameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID, savedGameState: GameState) => savedGameState);

        await attackService.attackCommand(gameID, { position: [0, 0] });

        const savedGameState = mockGameStateController.saveGame.mock.calls[0][1] as GameState;
        expect(savedGameState.players[0].attack_data[0][0]).toBe('M');
        expect(savedGameState.players[0].last_attack).toEqual({
            position: [0, 0],
            result: 'miss',
            target: 'O'
        });
    });

    it('should initialize nullable persisted last_attack values before saving attack results', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[0].last_attack = null;
        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementation(async () => gameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID, savedGameState: GameState) => savedGameState);

        await attackService.attackCommand(gameID, { position: [1, 1] });

        const savedGameState = mockGameStateController.saveGame.mock.calls[0][1] as GameState;
        expect(savedGameState.players[0].last_attack).toEqual({
            position: [1, 1],
            result: 'miss',
            target: 'O'
        });
    });

    it('should reject malformed attacks without saving partial state', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        gameState.phase = 'play';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, {} as Attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject invalid persisted target markers instead of crashing hit resolution', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[1].board_data[0][0] = 'X';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, { position: [0, 0] })).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})