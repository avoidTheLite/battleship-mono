import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { GameState, Attack } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, expect, beforeEach, jest, it } from "@jest/globals"


describe('Attack Service Test', () => {

    let mockGameStateController: any;
    let attackService: AttackService;
    let savedGameState: GameState;

    beforeEach(() => {
        mockGameStateController = {
            getGame: jest.fn(),
            saveGame: jest.fn((_gameID: string, gameState: GameState) => {
                savedGameState = gameState;
                return Promise.resolve(gameState);
            })
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

    it('records misses in attack data so the same square cannot be attacked again', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        gameState.phase = 'play';
        const attack: Attack = {
            position: [1, 1]
        };

        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementationOnce(() => Promise.resolve(savedGameState));

        const result = await attackService.attackCommand(gameID, attack);

        expect(result.players[0].attack_data[1][1]).toBe('M');
        expect(result.players[0].last_attack).toEqual({
            position: [1, 1],
            result: 'miss',
            target: 'O'
        });
        expect(result.active_player_index).toBe(1);

        result.active_player_index = 0;
        mockGameStateController.getGame.mockResolvedValueOnce(result);
        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).toHaveBeenCalledTimes(1);
    });

    it('records a hit without corrupting other rows in the attack board', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[1].board_data[2][3] = 'D';
        const attack: Attack = {
            position: [2, 3]
        };

        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementationOnce(() => Promise.resolve(savedGameState));

        const result = await attackService.attackCommand(gameID, attack);

        expect(result.players[0].attack_data[2][3]).toBe('H');
        expect(result.players[0].attack_data[0][3]).toBe('O');
        expect(result.players[0].attack_data[9][3]).toBe('O');
        expect(result.players[1].ship_data.find((ship) => ship.key === 'D')?.hits).toBe(1);
    });

    it('rejects malformed attacks before indexing into the board', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        gameState.phase = 'play';

        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, {} as Attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('rejects invalid defender markers instead of crashing while applying a hit', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[1].board_data[0][0] = 'X';

        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand(gameID, { position: [0, 0] })).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})