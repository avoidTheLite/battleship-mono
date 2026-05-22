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

    it('should persist missed attacks so the same coordinate cannot be attacked again', async () => {
        const gameID = 'test';
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        let savedGameState: GameState | undefined;
        mockGameStateController.getGame.mockImplementation(async () => savedGameState ?? gameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, state: GameState) => {
            savedGameState = state;
            return state;
        });

        const result = await attackService.attackCommand(gameID, { position: [2, 3] });

        expect(result.players[0].attack_data[2][3]).toBe('M');
        expect(result.players[0].last_attack).toEqual({
            position: [2, 3],
            result: 'miss',
            target: 'O',
        });
    });

    it('should reject attacks against already recorded misses', async () => {
        const gameID = 'test';
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[0].attack_data[2][3] = 'M';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, { position: [2, 3] })).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject malformed attack coordinates before indexing the board', async () => {
        const gameID = 'test';
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, { position: [0.5, 3] })).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject invalid persisted target markers instead of crashing', async () => {
        const gameID = 'test';
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[1].board_data[1][1] = 'X';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, { position: [1, 1] })).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})