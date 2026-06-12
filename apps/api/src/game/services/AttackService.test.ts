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
            updateGame: jest.fn()
        };
        attackService = new AttackService(mockGameStateController);
    });

    function mockGame(gameState: GameState): void {
        mockGameStateController.updateGame.mockImplementation(async (
            _gameID: string,
            update: (gameState: GameState) => GameState
        ) => update(gameState));
    }

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

        mockGame(createTestGame());
        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
    });

    it('should reject malformed attacks without entering the update transaction', async () => {
        await expect(attackService.attackCommand('test', { position: undefined } as unknown as Attack))
            .rejects.toThrow(AttackError);
        expect(mockGameStateController.updateGame).not.toHaveBeenCalled();
    });

    it('should persist missed attacks so they cannot be replayed', async () => {
        const gameID = 'test';
        const gameState = createPlayGame();
        mockGame(gameState);

        const result = await attackService.attackCommand(gameID, { position: [3, 4] });

        expect(result.players[0].attack_data[3][4]).toBe('M');
        expect(result.players[0].last_attack).toEqual({
            position: [3, 4],
            result: 'miss',
            target: 'O'
        });
        expect(result.active_player_index).toBe(1);
        expect(result.turn).toBe(2);
    });

    it('should reject replaying a missed attack', async () => {
        const gameID = 'test';
        const gameState = createPlayGame();
        gameState.players[0].attack_data[3][4] = 'M';
        mockGame(gameState);

        await expect(attackService.attackCommand(gameID, { position: [3, 4] }))
            .rejects.toThrow(AttackError);
    });

    it('should initialize null last_attack before recording a hit', async () => {
        const gameID = 'test';
        const gameState = createPlayGame();
        gameState.players[0].last_attack = null;
        gameState.players[1].board_data[0][0] = 'D';
        mockGame(gameState);

        const result = await attackService.attackCommand(gameID, { position: [0, 0] });

        expect(result.players[0].attack_data[0][0]).toBe('H');
        expect(result.players[0].last_attack).toEqual({
            position: [0, 0],
            result: 'hit',
            target: 'D'
        });
        expect(result.players[1].ship_data[4].hits).toBe(1);
    });

    it('should reject invalid defender markers instead of crashing', async () => {
        const gameID = 'test';
        const gameState = createPlayGame();
        gameState.players[1].board_data[0][0] = 'X';
        mockGame(gameState);

        await expect(attackService.attackCommand(gameID, { position: [0, 0] }))
            .rejects.toThrow(AttackError);
    });
})