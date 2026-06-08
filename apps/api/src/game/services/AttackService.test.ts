import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { Attack, Board, GameState } from "../../common/types/types.ts";
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

    function createPlayGame(): GameState {
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.turn = 1;
        gameState.active_player_index = 0;
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

    it('should persist a miss in attack data and last attack', async () => {
        const gameID = 'test';
        const gameState = createPlayGame();
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);
        mockGameStateController.saveGame.mockImplementationOnce(async (_gameID: string, savedGameState: GameState) => savedGameState);
        mockGameStateController.getGame.mockImplementationOnce(async () => mockGameStateController.saveGame.mock.calls[0][1]);

        const result = await attackService.attackCommand(gameID, { position: [4, 4] });

        expect(result.players[0].attack_data[4][4]).toBe('M');
        expect(result.players[0].last_attack).toEqual({
            position: [4, 4],
            result: 'miss',
            target: 'O'
        });
        expect(result.active_player_index).toBe(1);
    });

    it('should reject repeat attacks after a miss', async () => {
        const gameID = 'test';
        const gameState = createPlayGame();
        gameState.players[0].attack_data[4][4] = 'M';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, { position: [4, 4] })).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject invalid persisted target markers without saving corrupted state', async () => {
        const gameID = 'test';
        const gameState = createPlayGame();
        gameState.players[1].board_data[0][0] = 'X';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, { position: [0, 0] })).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should normalize a null last attack before recording an attack', async () => {
        const gameID = 'test';
        const gameState = createPlayGame();
        gameState.players[0].last_attack = null;
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);
        mockGameStateController.saveGame.mockImplementationOnce(async (_gameID: string, savedGameState: GameState) => savedGameState);
        mockGameStateController.getGame.mockImplementationOnce(async () => mockGameStateController.saveGame.mock.calls[0][1]);

        const result = await attackService.attackCommand(gameID, { position: [1, 1] });

        expect(result.players[0].last_attack).toEqual({
            position: [1, 1],
            result: 'miss',
            target: 'O'
        });
    });

    it('should reject malformed attacks instead of throwing a TypeError', async () => {
        const gameID = 'test';
        mockGameStateController.getGame.mockResolvedValueOnce(createPlayGame());

        await expect(attackService.attackCommand(gameID, {} as Attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})