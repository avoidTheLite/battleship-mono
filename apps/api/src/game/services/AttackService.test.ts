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

    it('should record a missed attack before saving the game', async () => {
        const gameID = 'test';
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockResolvedValueOnce(gameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, savedGameState: GameState) => savedGameState);

        await attackService.attackCommand(gameID, { position: [0, 0] });

        expect(mockGameStateController.saveGame).toHaveBeenCalledWith(
            gameID,
            expect.objectContaining({
                players: expect.arrayContaining([
                    expect.objectContaining({
                        player_index: 0,
                        attack_data: expect.arrayContaining([
                            ["M", "O", "O", "O", "O", "O", "O", "O", "O", "O"]
                        ]),
                        last_attack: {
                            position: [0, 0],
                            result: "miss",
                            target: "O"
                        }
                    })
                ])
            })
        );
    });
})