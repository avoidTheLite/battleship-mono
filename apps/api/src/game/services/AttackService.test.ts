import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { GameState, Attack } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, test, expect, beforeEach, jest } from "@jest/globals"


describe('Attack Service Test', () => {

    let mockGameStateController: any;
    let attackService: AttackService;
    let savedGameState: GameState | undefined;

    beforeEach(() => {
        savedGameState = undefined;
        mockGameStateController = {
            getGame: jest.fn(),
            saveGame: jest.fn(async (_gameID: string, gameState: GameState) => {
                savedGameState = gameState;
                return gameState;
            })
        };
        attackService = new AttackService(mockGameStateController);
    });

    test('should throw an error if the game is not in the play phase', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [0, 0]
        };

        mockGameStateController.getGame.mockResolvedValueOnce({
            phase: 'deploy'
        });
        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
    });

    test('records missed attacks so the same square cannot be attacked again', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.active_player_index = 0;
        mockGameStateController.getGame.mockImplementation(async () => savedGameState ?? gameState);

        await attackService.attackCommand(gameID, { position: [0, 0] });

        expect(savedGameState?.players[0].attack_data[0][0]).toBe('M');
        expect(savedGameState?.players[0].last_attack).toMatchObject({
            position: [0, 0],
            result: 'miss',
            target: 'O'
        });

        savedGameState!.active_player_index = 0;
        await expect(attackService.attackCommand(gameID, { position: [0, 0] })).rejects.toThrow(AttackError);
    });

    test('rejects malformed attacks before indexing the board', async () => {
        const gameState = createTestGame();
        gameState.phase = 'play';
        mockGameStateController.getGame.mockResolvedValue(gameState);

        await expect(
            attackService.attackCommand('test', { position: [0] } as unknown as Attack)
        ).rejects.toThrow(AttackError);
    });

    test('rejects invalid defender markers without crashing', async () => {
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[1].board_data[1][1] = 'Z';
        mockGameStateController.getGame.mockResolvedValue(gameState);

        await expect(attackService.attackCommand('test', { position: [1, 1] })).rejects.toThrow(AttackError);
    });
})