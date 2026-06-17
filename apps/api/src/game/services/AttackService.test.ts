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
            updateGame: jest.fn()
        };
        attackService = new AttackService(mockGameStateController);
    });

    it('should throw an error if the game is not in the play phase', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [0, 0]
        };
        const gameState = createTestGame();

        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID: string, updateGameState: (gameState: GameState) => GameState) => updateGameState(gameState));
        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
    });

    it('should persist a miss in attack data', async () => {
        const gameState: GameState = createTestGame();
        let savedGameState: GameState;
        gameState.phase = 'play';
        const attack: Attack = {
            position: [4, 4]
        };

        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID: string, updateGameState: (state: GameState) => GameState) => {
            savedGameState = updateGameState(gameState);
            return savedGameState;
        });

        await attackService.attackCommand('test', attack);

        expect(savedGameState.players[0].attack_data[4][4]).toBe('M');
        expect(savedGameState.players[0].attack_data[0][4]).toBe('O');
        expect(savedGameState.players[0].last_attack).toEqual({
            position: [4, 4],
            result: 'miss',
            target: 'O'
        });
    });

    it('should reject malformed attack positions without saving', async () => {
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID: string, updateGameState: (state: GameState) => GameState) => updateGameState(gameState));

        await expect(attackService.attackCommand('test', {} as Attack)).rejects.toThrow(AttackError);

        expect(mockGameStateController.updateGame).toHaveBeenCalledTimes(1);
    });

    it('should reject invalid defender markers without saving', async () => {
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[1].board_data[2][2] = 'X';
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID: string, updateGameState: (state: GameState) => GameState) => updateGameState(gameState));

        await expect(attackService.attackCommand('test', { position: [2, 2] })).rejects.toThrow(AttackError);

        expect(mockGameStateController.updateGame).toHaveBeenCalledTimes(1);
    });
})