import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { GameState, Attack } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";


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

    it('persists missed attacks so the same coordinate cannot be attacked again', async () => {
        const gameID = 'test';
        const gameState = createPlayableGame();
        let savedGameState: GameState | undefined;
        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementationOnce(async () => savedGameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, nextGameState: GameState) => {
            savedGameState = nextGameState;
            return nextGameState;
        });

        const result = await attackService.attackCommand(gameID, { position: [2, 3] });

        expect(result.players[0].attack_data[2][3]).toBe('M');
        expect(result.players[0].attack_data[1][3]).toBe('O');
        expect(result.players[0].last_attack).toEqual({
            position: [2, 3],
            result: 'miss',
            target: 'O'
        });
        expect(result.active_player_index).toBe(1);
    });

    it('rejects repeated attacks against a previously missed coordinate', async () => {
        const gameID = 'test';
        const gameState = createPlayableGame();
        gameState.players[0].attack_data[2][3] = 'M';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, { position: [2, 3] })).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('rejects invalid defender board markers instead of indexing missing ship data', async () => {
        const gameID = 'test';
        const gameState = createPlayableGame();
        gameState.players[1].board_data[4][4] = 'X';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, { position: [4, 4] })).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('rejects malformed attack payloads before reading coordinates', async () => {
        const gameID = 'test';
        const gameState = createPlayableGame();
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, {} as Attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
});

function createPlayableGame(): GameState {
    const gameState = createTestGame();
    gameState.phase = 'play';
    gameState.turn = 1;
    gameState.active_player_index = 0;
    return gameState;
}