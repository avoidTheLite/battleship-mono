import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { GameState, Attack, Board } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, test, expect, beforeEach } from "@jest/globals"

function createEmptyBoard(): Board {
    return createTestGame().players[0].attack_data;
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

    it('should record missed attacks in attack data before saving', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [2, 3]
        };
        const gameState: GameState = createTestGame();
        let savedGameState: GameState;

        gameState.phase = 'play';
        gameState.players[0].attack_data = createEmptyBoard();
        gameState.players[1].board_data = createEmptyBoard();

        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementationOnce(async () => savedGameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID, state) => {
            savedGameState = state;
            return state;
        });

        await attackService.attackCommand(gameID, attack);

        expect(savedGameState.players[0].attack_data[2][3]).toBe('M');
        expect(savedGameState.players[0].attack_data[0][3]).toBe('O');
        expect(savedGameState.players[0].last_attack).toEqual({
            position: [2, 3],
            result: 'miss',
            target: 'O'
        });
    });
})