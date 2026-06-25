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
        const gameID = 'test';
        const gameState: GameState = createTestGame();
        let savedGameState: GameState | undefined;

        gameState.phase = 'play';
        mockGameStateController.getGame.mockImplementation(async () => savedGameState ?? gameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID, updatedGameState) => {
            savedGameState = updatedGameState;
            return updatedGameState;
        });

        const result = await attackService.attackCommand(gameID, { position: [2, 3] });

        expect(result.players[0].attack_data[2][3]).toBe('M');
        expect(result.players[0].attack_data[0][3]).toBe('O');
        expect(result.players[0].last_attack).toEqual({
            position: [2, 3],
            result: 'miss',
            target: 'O'
        });
    });

    it('should reject malformed attacks without saving', async () => {
        const gameID = 'test';
        const gameState: GameState = createTestGame();

        gameState.phase = 'play';
        mockGameStateController.getGame.mockResolvedValue(gameState);

        await expect(
            attackService.attackCommand(gameID, {} as Attack)
        ).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject invalid defender markers without crashing', async () => {
        const gameID = 'test';
        const gameState: GameState = createTestGame();

        gameState.phase = 'play';
        gameState.players[1].board_data[0][0] = 'X';
        mockGameStateController.getGame.mockResolvedValue(gameState);

        await expect(
            attackService.attackCommand(gameID, { position: [0, 0] })
        ).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})