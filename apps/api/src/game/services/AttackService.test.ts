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
            updateGame: jest.fn()
        };
        attackService = new AttackService(mockGameStateController);
    });

    function mockGameUpdate(gameState: GameState) {
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID: string, update) => update(gameState));
    }

    it('should throw an error if the game is not in the play phase', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [0, 0]
        };

        mockGameUpdate(createTestGame());

        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
    });

    it('records missed attacks in attack data', async () => {
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.turn = 1;
        mockGameUpdate(gameState);

        const result = await attackService.attackCommand('test', { position: [0, 0] });

        expect(result.players[0].attack_data[0][0]).toBe('M');
        expect(result.players[0].last_attack).toEqual({
            position: [0, 0],
            result: 'miss',
            target: 'O'
        });
        expect(result.active_player_index).toBe(1);
    });

    it('rejects repeat attacks against missed cells', async () => {
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[0].attack_data[0][0] = 'M';
        mockGameUpdate(gameState);

        await expect(attackService.attackCommand('test', { position: [0, 0] })).rejects.toThrow(AttackError);
    });

    it('rejects malformed attacks before indexing board data', async () => {
        const gameState = createTestGame();
        gameState.phase = 'play';
        mockGameUpdate(gameState);

        await expect(attackService.attackCommand('test', {} as Attack)).rejects.toThrow(AttackError);
    });

    it('rejects invalid persisted defender markers instead of crashing', async () => {
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[1].board_data[0][0] = 'X';
        mockGameUpdate(gameState);

        await expect(attackService.attackCommand('test', { position: [0, 0] })).rejects.toThrow(AttackError);
    });
})