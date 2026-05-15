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

    function mockPlayableGame(gameState: GameState): void {
        let savedGameState: GameState = gameState;
        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementation(async () => savedGameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, updatedGameState: GameState) => {
            savedGameState = updatedGameState;
            return updatedGameState;
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

    it('should persist missed attacks in the active player attack data', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [2, 3]
        };
        const gameState = createTestGame();
        gameState.phase = 'play';
        mockPlayableGame(gameState);

        await attackService.attackCommand(gameID, attack);

        const savedGameState = mockGameStateController.saveGame.mock.calls[0][1] as GameState;
        expect(savedGameState.players[0].attack_data[2][3]).toBe('M');
        expect(savedGameState.players[0].attack_data[1][3]).toBe('O');
        expect(savedGameState.players[0].last_attack).toEqual({
            position: [2, 3],
            result: 'miss',
            target: 'O'
        });
    });

    it('should reject attacks against a previously missed location', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [2, 3]
        };
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[0].attack_data[2][3] = 'M';
        mockPlayableGame(gameState);

        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject invalid ship markers instead of crashing while applying a hit', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [0, 0]
        };
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[1].board_data[0][0] = 'X';
        mockPlayableGame(gameState);

        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})