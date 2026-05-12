import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { GameState, Attack } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, test, expect, beforeEach, jest } from "@jest/globals"


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

    it('should reject attacks without coordinates without throwing a TypeError', async () => {
        const gameState = createTestGame();
        gameState.phase = 'play';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand('test', {})).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should initialize legacy null attack state before saving a miss', async () => {
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[0].last_attack = null as any;
        let savedGameState: GameState | undefined;
        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementationOnce(async () => savedGameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, nextGameState: GameState) => {
            savedGameState = nextGameState;
            return nextGameState;
        });

        const result = await attackService.attackCommand('test', { position: [2, 3] });

        expect(result.players[0].last_attack).toEqual({
            position: [2, 3],
            result: 'miss',
            target: 'O'
        });
        expect(result.players[0].attack_data[2][3]).toBe('M');
    });

    it('should reject repeated attacks after a previous miss', async () => {
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[0].attack_data[2][3] = 'M';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand('test', { position: [2, 3] })).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject a hit against a defender board with an unknown ship key', async () => {
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[1].board_data[2][3] = 'Z';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand('test', { position: [2, 3] })).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})