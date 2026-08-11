import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { GameState, Attack } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, it, expect, beforeEach, jest } from "@jest/globals"


describe('Attack Service Test', () => {

    let mockGameStateController: any;
    let attackService: AttackService;
    let testGame: GameState;

    function cloneGame(gameState: GameState): GameState {
        return structuredClone(gameState);
    }

    function setupPlayGame(gameState: GameState = createTestGame()): GameState {
        gameState.phase = 'play';
        gameState.turn = 1;
        gameState.active_player_index = 0;
        return gameState;
    }

    function mockControllerState(gameState: GameState): void {
        mockGameStateController.updateGame.mockImplementation(async (_gameID: string, mutateGameState: (gameState: GameState) => GameState) => {
            return mutateGameState(cloneGame(gameState));
        });
    }

    beforeEach(() => {
        mockGameStateController = {
            updateGame: jest.fn()
        };
        attackService = new AttackService(mockGameStateController);
        testGame = setupPlayGame();
    });

    it('should throw an error if the game is not in the play phase', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [0, 0]
        };

        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID: string, mutateGameState: (gameState: GameState) => GameState) => {
            return mutateGameState(createTestGame());
        });
        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
    });

    it('should persist misses in attack data', async () => {
        mockControllerState(testGame);

        const gameState = await attackService.attackCommand('test', {
            position: [0, 0]
        });

        expect(gameState.players[0].attack_data[0][0]).toBe('M');
        expect(gameState.players[0].last_attack).toEqual({
            position: [0, 0],
            result: 'miss',
            target: 'O'
        });
        expect(gameState.active_player_index).toBe(1);
        expect(mockGameStateController.updateGame).toHaveBeenCalledTimes(1);
    });

    it('should reject a repeated miss location', async () => {
        testGame.players[0].attack_data[0][0] = 'M';
        mockControllerState(testGame);

        await expect(attackService.attackCommand('test', {
            position: [0, 0]
        })).rejects.toThrow(AttackError);
    });

    it('should reject malformed attack positions before indexing the board', async () => {
        mockControllerState(testGame);

        await expect(attackService.attackCommand('test', {
            position: [0, Number.NaN]
        } as Attack)).rejects.toThrow(AttackError);
    });

    it('should reject corrupted defender board markers instead of crashing', async () => {
        testGame.players[1].board_data[0][0] = 'X';
        mockControllerState(testGame);

        await expect(attackService.attackCommand('test', {
            position: [0, 0]
        })).rejects.toThrow(AttackError);
    });
})
