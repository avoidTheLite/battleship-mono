import AttackService from "./AttackService.ts";
import DeployService from "./DeployService.ts";
import { AttackError, DeployError } from "../../common/types/errors.ts";
import type { Attack, Board, GameState } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import createBoard from "../../common/util/createBoard.ts";
import { describe, expect, beforeEach, jest } from "@jest/globals"


describe('Attack Service Test', () => {

    let mockGameStateController: any;
    let attackService: AttackService;
    let deployService: DeployService;

    beforeEach(() => {
        mockGameStateController = {
            getGame: jest.fn(),
            saveGame: jest.fn()
        };
        attackService = new AttackService(mockGameStateController);
        deployService = new DeployService(mockGameStateController);
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

    it('should create boards with independent rows', () => {
        const board = createBoard();

        board[0][0] = 'H';

        expect(board[0][0]).toBe('H');
        expect(board[1][0]).toBe('O');
    });

    it('should persist a miss in the attacker attack data', async () => {
        const gameID = 'test';
        const attack: Attack = {
            position: [2, 3]
        };
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        mockGameStateController.getGame.mockResolvedValue(gameState);
        mockGameStateController.saveGame.mockImplementation(async (_gameID: string, savedGameState: GameState) => savedGameState);

        const result = await attackService.attackCommand(gameID, attack);

        expect(result.players[0].attack_data[2][3]).toBe('M');
        expect(result.players[0].last_attack).toEqual({
            position: [2, 3],
            result: 'miss',
            target: 'O'
        });
        expect(result.active_player_index).toBe(1);
        expect(mockGameStateController.saveGame).toHaveBeenCalledWith(gameID, gameState);
    });

    it('should reject attacks that were already recorded as misses', async () => {
        const attack: Attack = {
            position: [2, 3]
        };
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[0].attack_data[2][3] = 'M';
        mockGameStateController.getGame.mockResolvedValue(gameState);

        await expect(attackService.attackCommand('test', attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject malformed attack coordinates without saving', async () => {
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        mockGameStateController.getGame.mockResolvedValue(gameState);

        await expect(attackService.attackCommand('test', { position: [Number.NaN, 1] } as Attack)).rejects.toThrow(AttackError);
        await expect(attackService.attackCommand('test', {} as Attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject invalid defender board markers instead of corrupting ship data', async () => {
        const attack: Attack = {
            position: [2, 3]
        };
        const gameState: GameState = createTestGame();
        gameState.phase = 'play';
        gameState.players[1].board_data[2][3] = 'X';
        mockGameStateController.getGame.mockResolvedValue(gameState);

        await expect(attackService.attackCommand('test', attack)).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('should reject deploy boards with unknown ship markers', async () => {
        const deployBoard: Board = createBoard();
        const gameState: GameState = createTestGame();
        for (let i = 0; i < 17; i++) {
            deployBoard[Math.floor(i / 10)][i % 10] = 'X';
        }
        mockGameStateController.getGame.mockResolvedValue(gameState);

        await expect(deployService.deployCommand('test', deployBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})