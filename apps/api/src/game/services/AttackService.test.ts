import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { Attack, GameState } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, expect, beforeEach, it, jest } from "@jest/globals"


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

        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID: string, update: (gameState: GameState) => GameState) => {
            return update({ phase: 'deploy' } as GameState);
        });
        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
    });

    it('records missed attacks so the same position cannot be attacked again', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [0, 0]
        };
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        gameState.turn = 1;

        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID: string, update: (gameState: GameState) => GameState) => {
            return update(gameState);
        });

        const savedGameState = await attackService.attackCommand(gameID, attack);

        expect(savedGameState.players[0].attack_data[0][0]).toBe('M');
        expect(savedGameState.players[0].last_attack).toEqual({
            position: [0, 0],
            result: 'miss',
            target: 'O'
        });
    });

    it('rejects attacks against a recorded miss', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [0, 0]
        };
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[0].attack_data[0][0] = 'M';
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID: string, update: (gameState: GameState) => GameState) => {
            return update(gameState);
        });

        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
    });

    it('rejects malformed attack positions without crashing', async () => {
        const gameID = 'test';
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID: string, update: (gameState: GameState) => GameState) => {
            return update(gameState);
        });

        await expect(attackService.attackCommand(gameID, {} as Attack)).rejects.toThrow(AttackError);
    });

    it('normalizes a null last attack before writing attack results', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [0, 0]
        };
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        (gameState.players[0] as any).last_attack = null;

        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID: string, update: (gameState: GameState) => GameState) => {
            return update(gameState);
        });

        const savedGameState = await attackService.attackCommand(gameID, attack);

        expect(savedGameState.players[0].last_attack).toEqual({
            position: [0, 0],
            result: 'miss',
            target: 'O'
        });
    });

    it('throws AttackError for corrupted defender board markers', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [0, 0]
        };
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[1].board_data[0][0] = 'X';
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID: string, update: (gameState: GameState) => GameState) => {
            return update(gameState);
        });

        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
    });
})