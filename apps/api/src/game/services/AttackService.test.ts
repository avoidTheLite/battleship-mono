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

    function createPlayableGame(): GameState {
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.turn = 1;
        gameState.active_player_index = 0;
        return gameState;
    }

    function mockSaveAndReload(): void {
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, gameState: GameState) => gameState);
        mockGameStateController.getGame.mockImplementationOnce(async (gameID: string) => {
            if (gameID !== 'test') {
                throw new Error('Unexpected game ID');
            }
            return createPlayableGame();
        });
        mockGameStateController.getGame.mockImplementationOnce(async () => mockGameStateController.saveGame.mock.calls[0][1]);
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

    it('records misses in attack data so the same location cannot be replayed', async () => {
        mockSaveAndReload();

        const result = await attackService.attackCommand('test', { position: [9, 9] });

        expect(result.players[0].attack_data[9][9]).toBe('M');
        expect(result.players[0].last_attack).toEqual({
            position: [9, 9],
            result: 'miss',
            target: 'O',
        });
        expect(mockGameStateController.saveGame).toHaveBeenCalledTimes(1);
    });

    it('rejects attacks against a previously missed coordinate', async () => {
        const gameState = createPlayableGame();
        gameState.players[0].attack_data[4][4] = 'M';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand('test', { position: [4, 4] })).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('rejects malformed attack payloads before indexing board data', async () => {
        mockGameStateController.getGame.mockResolvedValueOnce(createPlayableGame());

        await expect(attackService.attackCommand('test', {} as Attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('rejects invalid persisted target markers instead of crashing ship lookup', async () => {
        const gameState = createPlayableGame();
        gameState.players[1].board_data[0][0] = 'X';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand('test', { position: [0, 0] })).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})