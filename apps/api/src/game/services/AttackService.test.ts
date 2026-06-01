import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { GameState, Attack } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, it, expect, beforeEach, jest } from "@jest/globals"

function createPlayPhaseGame(): GameState {
    const gameState = createTestGame();
    gameState.phase = 'play';
    gameState.turn = 1;
    gameState.active_player_index = 0;
    return gameState;
}


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
        const gameState = createPlayPhaseGame();
        gameState.players[0].last_attack = null as any;
        let savedGameState: GameState | undefined;

        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementationOnce(async () => savedGameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, nextGameState: GameState) => {
            savedGameState = nextGameState;
            return nextGameState;
        });

        const result = await attackService.attackCommand(gameID, { position: [0, 0] });

        expect(result.players[0].attack_data[0][0]).toBe('M');
        expect(result.players[0].last_attack).toEqual({
            position: [0, 0],
            result: 'miss',
            target: 'O'
        });
        expect(result.active_player_index).toBe(1);
    });

    it('should reject malformed attack coordinates before reading board data', async () => {
        const gameID = 'test';
        mockGameStateController.getGame.mockResolvedValueOnce(createPlayPhaseGame());

        await expect(
            attackService.attackCommand(gameID, { position: ['bad', 0] as any })
        ).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject invalid target markers instead of crashing', async () => {
        const gameID = 'test';
        const gameState = createPlayPhaseGame();
        gameState.players[1].board_data[0][0] = 'X';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(
            attackService.attackCommand(gameID, { position: [0, 0] })
        ).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})