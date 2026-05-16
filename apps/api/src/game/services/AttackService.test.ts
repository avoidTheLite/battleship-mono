import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { GameState, Attack } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, it, expect, beforeEach, jest } from "@jest/globals"

function createPlayGame(): GameState {
    const gameState = createTestGame();
    gameState.phase = 'play';
    gameState.turn = 1;
    gameState.active_player_index = 0;
    return gameState;
}

function controllerForGame(gameState: GameState): any {
    return {
        getGame: jest.fn()
            .mockResolvedValueOnce(gameState)
            .mockImplementation(async () => gameState),
        saveGame: jest.fn(async (_gameID: string, nextGameState: GameState) => nextGameState)
    };
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

    it('should record a missed attack so the same coordinate cannot be attacked again', async () => {
        const gameID = 'test';
        const gameState = createPlayGame();
        const attack: Attack = {
            position: [0, 0]
        };
        mockGameStateController = controllerForGame(gameState);
        attackService = new AttackService(mockGameStateController);

        await attackService.attackCommand(gameID, attack);
        const savedGameState = mockGameStateController.saveGame.mock.calls[0][1] as GameState;

        expect(savedGameState.players[0].attack_data[0][0]).toBe('M');
        expect(savedGameState.players[0].last_attack).toMatchObject({
            position: [0, 0],
            result: 'miss',
            target: 'O'
        });
    });

    it('should reject attacking a coordinate already marked as a miss', async () => {
        const gameID = 'test';
        const gameState = createPlayGame();
        gameState.players[0].attack_data[0][0] = 'M';
        const attack: Attack = {
            position: [0, 0]
        };
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject corrupted defender board markers without saving partial attack state', async () => {
        const gameID = 'test';
        const gameState = createPlayGame();
        gameState.players[1].board_data[0][0] = 'X';
        const attack: Attack = {
            position: [0, 0]
        };
        mockGameStateController = controllerForGame(gameState);
        attackService = new AttackService(mockGameStateController);

        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})