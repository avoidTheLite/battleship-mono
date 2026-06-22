import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { GameState, Attack } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, it, expect, beforeEach, jest } from "@jest/globals"


describe('Attack Service Test', () => {

    let mockGameStateController: any;
    let attackService: AttackService;
    let savedGameState: GameState;

    beforeEach(() => {
        mockGameStateController = {
            getGame: jest.fn(),
            saveGame: jest.fn()
        };
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, gameState: GameState) => {
            savedGameState = gameState;
            return gameState;
        });
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

    it('should persist a miss in attack data', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        const attack: Attack = {
            position: [2, 3]
        };
        gameState.phase = 'play';
        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementationOnce(async () => savedGameState);

        const result = await attackService.attackCommand(gameID, attack);

        expect(result.players[0].attack_data[2][3]).toBe('M');
        expect(result.players[0].last_attack).toEqual({
            position: [2, 3],
            result: 'miss',
            target: 'O'
        });
    });

    it('should reject a repeated attack against a missed cell', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        const attack: Attack = {
            position: [2, 3]
        };
        gameState.phase = 'play';
        gameState.players[0].attack_data[2][3] = 'M';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject malformed attack positions without crashing', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        gameState.phase = 'play';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, {} as Attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject invalid persisted ship markers instead of throwing a TypeError', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        const attack: Attack = {
            position: [0, 0]
        };
        gameState.phase = 'play';
        gameState.players[1].board_data[0][0] = 'X';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})