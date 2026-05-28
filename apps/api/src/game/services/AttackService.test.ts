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

    function setupPlayGame(): GameState {
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.turn = 1;
        gameState.active_player_index = 0;
        return gameState;
    }

    function mockSavedGame(gameState: GameState): void {
        let savedGameState: GameState = gameState;
        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementationOnce(async () => savedGameState);
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

    it('persists missed attacks so the same square cannot be replayed as empty', async () => {
        const gameID = 'test';
        const gameState = setupPlayGame();
        mockSavedGame(gameState);

        const result = await attackService.attackCommand(gameID, { position: [0, 0] });

        expect(mockGameStateController.saveGame).toHaveBeenCalledTimes(1);
        expect(result.players[0].attack_data[0][0]).toBe('M');
        expect(result.players[0].last_attack).toEqual({
            position: [0, 0],
            result: 'miss',
            target: 'O'
        });
    });

    it('normalizes null last attack records before applying a new attack', async () => {
        const gameID = 'test';
        const gameState = setupPlayGame();
        gameState.players[0].last_attack = null as any;
        mockSavedGame(gameState);

        const result = await attackService.attackCommand(gameID, { position: [1, 1] });

        expect(result.players[0].last_attack).toEqual({
            position: [1, 1],
            result: 'miss',
            target: 'O'
        });
    });

    it('rejects malformed attack payloads before indexing coordinates', async () => {
        const gameID = 'test';
        const gameState = setupPlayGame();
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, {} as Attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('rejects invalid defender markers instead of crashing ship lookup', async () => {
        const gameID = 'test';
        const gameState = setupPlayGame();
        gameState.players[1].board_data[0][0] = 'X';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, { position: [0, 0] })).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})