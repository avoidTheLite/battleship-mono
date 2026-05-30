import AttackService from "./AttackService.ts";
import { AttackError } from "../../common/types/errors.ts";
import type { GameState, Attack } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, it, expect, beforeEach, jest } from "@jest/globals"


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

    it('should persist missed attacks so the same coordinate cannot be attacked twice', async () => {
        const gameID = 'test';
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        gameState.turn = 1;
        gameState.active_player_index = 0;
        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementationOnce(() => mockGameStateController.saveGame.mock.calls[0][1]);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, savedGameState: GameState) => savedGameState);

        const retrievedGameState = await attackService.attackCommand(gameID, { position: [3, 4] });

        expect(mockGameStateController.saveGame).toHaveBeenCalledWith(
            gameID,
            expect.objectContaining({
                active_player_index: 1,
                turn: 2
            })
        );
        expect(retrievedGameState.players[0].attack_data[3][4]).toBe('M');
        expect(retrievedGameState.players[0].last_attack).toEqual({
            position: [3, 4],
            result: 'miss',
            target: 'O'
        });
    });

    it('should reject malformed attacks before indexing into attack data', async () => {
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand('test', {} as Attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject invalid persisted target markers without corrupting attack history', async () => {
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[1].board_data[0][0] = 'X';
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(attackService.attackCommand('test', { position: [0, 0] })).rejects.toThrow(AttackError);
        expect(gameState.players[0].attack_data[0][0]).toBe('O');
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})