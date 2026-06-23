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

    function mockUpdateWith(gameState: GameState) {
        mockGameStateController.updateGame.mockImplementationOnce(async (_gameID, update) => update(gameState));
    }

    it('should throw an error if the game is not in the play phase', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [0, 0]
        };

        mockUpdateWith(createTestGame());
        await expect(attackService.attackCommand(gameID, attack)).rejects.toThrow(AttackError);
    });

    it('records a miss so the same cell cannot be attacked again', async () => {
        const gameID = 'test';
        const firstAttack: Attack = {
            position: [0, 0]
        };
        const firstGameState = createPlayGame();
        firstGameState.players[0].last_attack = null;
        mockUpdateWith(firstGameState);

        const result = await attackService.attackCommand(gameID, firstAttack);

        expect(result.players[0].attack_data[0][0]).toBe('M');
        expect(result.players[0].last_attack).toMatchObject({
            position: [0, 0],
            result: 'miss',
            target: 'O'
        });

        const repeatedAttackGameState = createPlayGame();
        repeatedAttackGameState.players[0].attack_data[0][0] = 'M';
        mockUpdateWith(repeatedAttackGameState);

        await expect(attackService.attackCommand(gameID, firstAttack)).rejects.toThrow(AttackError);
    });

    it('rejects malformed attack positions before indexing the board', async () => {
        mockUpdateWith(createPlayGame());

        await expect(attackService.attackCommand('test', {} as Attack)).rejects.toThrow(AttackError);
    });

    it('rejects invalid target markers instead of indexing ship data with -1', async () => {
        const gameState = createPlayGame();
        const attack: Attack = {
            position: [0, 0]
        };
        gameState.players[1].board_data[0][0] = 'X';
        mockUpdateWith(gameState);

        await expect(attackService.attackCommand('test', attack)).rejects.toThrow(AttackError);
    });
})