import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { GameState, Attack } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, it, expect, beforeEach, jest } from "@jest/globals"


describe('Attack Service Test', () => {

    let mockGameStateController: any;
    let attackService: AttackService;

    beforeEach(() => {
        let savedGameState: GameState | undefined;
        mockGameStateController = {
            getGame: jest.fn(async () => savedGameState),
            saveGame: jest.fn(async (_gameID: string, gameState: GameState) => {
                savedGameState = gameState;
                return gameState;
            })
        };
        attackService = new AttackService(mockGameStateController);
    });

    function createPlayGame(): GameState {
        const gameState = createTestGame();
        gameState.phase = 'play';
        return gameState;
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

    it('should persist missed attacks so the same cell cannot be attacked again', async () => {
        const gameID = 'test';
        const gameState = createPlayGame();
        const attack: Attack = {
            position: [0, 0]
        };

        mockGameStateController.getGame.mockResolvedValueOnce(gameState);
        mockGameStateController.getGame.mockImplementation(async () => mockGameStateController.saveGame.mock.calls[0][1]);

        const result = await attackService.attackCommand(gameID, attack);

        expect(result.players[0].attack_data[0][0]).toBe('M');
        expect(result.players[0].last_attack).toEqual({
            position: [0, 0],
            result: 'miss',
            target: 'O'
        });
    });

    it('should reject an invalid persisted ship target instead of crashing', async () => {
        const gameID = 'test';
        const gameState = createPlayGame();
        gameState.players[1].board_data[0][0] = 'X';
        const attack: Attack = {
            position: [0, 0]
        };

        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})