import AttackService from "./AttackService.ts";
import { turnManager } from "../gameState.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { GameState, Attack } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, test, expect, beforeEach } from "@jest/globals"


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

    it('should record a missed attack and tolerate missing last attack data', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [2, 3]
        };
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[0].last_attack = null;
        let savedGameState: GameState;

        mockGameStateController.getGame.mockImplementation(async () => savedGameState ?? gameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID, nextGameState) => {
            savedGameState = nextGameState;
            return nextGameState;
        });

        const result = await attackService.attackCommand(gameID, attack);

        expect(result.players[0].attack_data[2][3]).toBe('M');
        expect(result.players[0].last_attack).toEqual({
            position: [2, 3],
            result: 'miss',
            target: 'O'
        });
        expect(result.active_player_index).toBe(1);
        expect(result.turn).toBe(1);
    });

    it('should reject a repeat attack on a missed location', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [4, 5]
        };
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[0].attack_data[4][5] = 'M';

        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})