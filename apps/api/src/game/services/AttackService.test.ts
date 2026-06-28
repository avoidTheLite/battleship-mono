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

    function createPlayGame(): GameState {
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.turn = 1;
        gameState.active_player_index = 0;
        return gameState;
    }

    function mockUpdateGame(gameState: GameState): void {
        mockGameStateController.updateGame.mockImplementation(async (_gameID, updateGameState) => {
            return updateGameState(gameState);
        });
    }

    it('should throw an error if the game is not in the play phase', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [0, 0]
        };

        mockUpdateGame(createTestGame());
        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
    });

    it('should persist missed attacks in attack data', async () => {
        const gameState = createPlayGame();
        mockUpdateGame(gameState);

        const result = await attackService.attackCommand('test', {
            position: [0, 0]
        });

        expect(result.players[0].attack_data[0][0]).toBe('M');
        expect(result.players[0].last_attack).toEqual({
            position: [0, 0],
            result: 'miss',
            target: 'O'
        });
        expect(result.turn).toBe(2);
        expect(result.active_player_index).toBe(1);
    });

    it('should reject malformed attacks before indexing board data', async () => {
        const gameState = createPlayGame();
        mockUpdateGame(gameState);

        await expect(attackService.attackCommand('test', {} as Attack)).rejects.toThrow(AttackError);
    });

    it('should reject invalid defender markers without mutating attack data', async () => {
        const gameState = createPlayGame();
        gameState.players[1].board_data[0][0] = 'X';
        mockUpdateGame(gameState);

        await expect(attackService.attackCommand('test', {
            position: [0, 0]
        })).rejects.toThrow(AttackError);
        expect(gameState.players[0].attack_data[0][0]).toBe('O');
    });
})