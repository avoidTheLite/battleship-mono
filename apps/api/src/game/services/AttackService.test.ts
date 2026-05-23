import AttackService from "./AttackService.ts";
import DeployService from "./DeployService.ts";
import { AttackError, DeployError } from "../../common/types/errors.ts";
import type { Attack, Board, GameState } from "../../common/types/types.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import createBoard from "../../common/util/createBoard.ts";
import { describe, expect, beforeEach } from "@jest/globals"

function createPlayGame(): GameState {
    const gameState = createTestGame();
    gameState.phase = 'play';
    gameState.turn = 1;
    gameState.active_player_index = 0;
    return gameState;
}

function createValidDeployment(): Board {
    const board = createBoard();
    board[0][0] = "A";
    board[0][1] = "A";
    board[0][2] = "A";
    board[0][3] = "A";
    board[0][4] = "A";
    board[1][0] = "B";
    board[1][1] = "B";
    board[1][2] = "B";
    board[1][3] = "B";
    board[2][0] = "C";
    board[2][1] = "C";
    board[2][2] = "C";
    board[3][0] = "S";
    board[3][1] = "S";
    board[3][2] = "S";
    board[4][0] = "D";
    board[4][1] = "D";
    return board;
}

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

    it('records misses in attack data so the same square cannot be replayed', async () => {
        const gameID = 'test';
        const gameState = createPlayGame();
        gameState.players[0].last_attack = null;
        let savedGameState: GameState | undefined;

        mockGameStateController.getGame.mockImplementation(() => Promise.resolve(savedGameState ?? gameState));
        mockGameStateController.saveGame.mockImplementation((_gameID: string, nextGameState: GameState) => {
            savedGameState = nextGameState;
            return Promise.resolve(nextGameState);
        });

        const result = await attackService.attackCommand(gameID, {
            position: [4, 6]
        });

        expect(result.players[0].attack_data[4][6]).toEqual("M");
        expect(result.players[0].last_attack).toMatchObject({
            position: [4, 6],
            result: 'miss',
            target: 'O'
        });
    });

    it('marks only the attacked hit coordinate on a new attack board', async () => {
        const gameID = 'test';
        const gameState = createPlayGame();
        gameState.players[1].board_data[4][6] = "D";
        let savedGameState: GameState | undefined;

        mockGameStateController.getGame.mockImplementation(() => Promise.resolve(savedGameState ?? gameState));
        mockGameStateController.saveGame.mockImplementation((_gameID: string, nextGameState: GameState) => {
            savedGameState = nextGameState;
            return Promise.resolve(nextGameState);
        });

        const result = await attackService.attackCommand(gameID, {
            position: [4, 6]
        });

        expect(result.players[0].attack_data[4][6]).toEqual("H");
        expect(result.players[0].attack_data[0][6]).toEqual("O");
        expect(result.players[0].attack_data[9][6]).toEqual("O");
    });

    it('rejects invalid persisted target markers instead of crashing during attack resolution', async () => {
        const gameID = 'test';
        const gameState = createPlayGame();
        gameState.players[1].board_data[4][6] = "X";

        mockGameStateController.getGame.mockResolvedValue(gameState);

        await expect(attackService.attackCommand(gameID, {
            position: [4, 6]
        })).rejects.toThrow(AttackError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
})

describe('Deploy Service Test', () => {

    let mockGameStateController: any;
    let deployService: DeployService;

    beforeEach(() => {
        mockGameStateController = {
            getGame: jest.fn(),
            saveGame: jest.fn()
        };
        deployService = new DeployService(mockGameStateController);
    });

    it('rejects deployments with the right occupied count but invalid ship keys', async () => {
        const gameState = createTestGame();
        const invalidBoard = createBoard();
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 10; col++) {
                if ((row * 10) + col < 17) {
                    invalidBoard[row][col] = "X";
                }
            }
        }

        mockGameStateController.getGame.mockResolvedValue(gameState);

        await expect(deployService.deployCommand('test', invalidBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it('accepts deployments with the exact expected ship key counts', async () => {
        const gameState = createTestGame();
        const validBoard = createValidDeployment();
        let savedGameState: GameState | undefined;

        mockGameStateController.getGame.mockImplementation(() => Promise.resolve(savedGameState ?? gameState));
        mockGameStateController.saveGame.mockImplementation((_gameID: string, nextGameState: GameState) => {
            savedGameState = nextGameState;
            return Promise.resolve(nextGameState);
        });

        const result = await deployService.deployCommand('test', validBoard);

        expect(result.players[0].board_data).toEqual(validBoard);
        expect(result.active_player_index).toEqual(1);
    });
})