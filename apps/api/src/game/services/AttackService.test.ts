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

    it('should only mark the attacked square on a hit', async () => {
        const gameID = 'test';
        const gameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[1].board_data[0][0] = 'A';

        mockGameStateController.getGame.mockResolvedValue(gameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, savedGameState: GameState) => savedGameState);

        await attackService.attackCommand(gameID, { position: [0, 0] });

        expect(gameState.players[0].attack_data[0][0]).toBe('H');
        expect(gameState.players[0].attack_data[1][0]).toBe('O');
        expect(gameState.players[0].attack_data[9][0]).toBe('O');
    });
})