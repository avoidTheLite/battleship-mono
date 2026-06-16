import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { GameState, Attack } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, it, expect, beforeEach, jest } from "@jest/globals"


describe('Attack Service Test', () => {

    let mockGameStateController: {
        getGame: jest.Mock;
        saveGame: jest.Mock;
    };
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

    it('should persist a missed attack in exactly one attack data cell', async () => {
        const gameID = 'test';
        const gameState: GameState = createTestGame();
        let savedGameState: GameState;
        gameState.phase = 'play';
        gameState.turn = 1;

        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementation(async () => savedGameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, state: GameState) => {
            savedGameState = state;
            return state;
        });

        const result = await attackService.attackCommand(gameID, { position: [0, 0] });

        expect(result.players[0].attack_data[0][0]).toBe("M");
        expect(result.players[0].attack_data[1][0]).toBe("O");
        expect(result.players[0].last_attack).toEqual({
            position: [0, 0],
            result: "miss",
            target: "O"
        });
        expect(result.active_player_index).toBe(1);
    });
})