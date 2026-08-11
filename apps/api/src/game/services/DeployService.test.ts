import DeployService from "./DeployService.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { Board, GameState } from "../../common/types/types.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";

describe('Deploy Service Test', () => {
    let mockGameStateController: any;
    let deployService: DeployService;
    let testGame: GameState;

    function cloneGame(gameState: GameState): GameState {
        return structuredClone(gameState);
    }

    function createValidDeployBoard(): Board {
        const board = createBoard();
        board[0].splice(0, 5, "A", "A", "A", "A", "A");
        board[1].splice(0, 4, "B", "B", "B", "B");
        board[2].splice(0, 3, "C", "C", "C");
        board[3].splice(0, 3, "S", "S", "S");
        board[4].splice(0, 2, "D", "D");
        return board;
    }

    function mockControllerState(gameState: GameState): void {
        mockGameStateController.updateGame.mockImplementation(async (_gameID: string, mutateGameState: (gameState: GameState) => GameState) => {
            return mutateGameState(cloneGame(gameState));
        });
    }

    beforeEach(() => {
        mockGameStateController = {
            updateGame: jest.fn()
        };
        deployService = new DeployService(mockGameStateController);
        testGame = createTestGame();
        mockControllerState(testGame);
    });

    it('should reject boards with invalid ship markers before saving', async () => {
        const board = createValidDeployBoard();
        board[0][0] = 'X';

        await expect(deployService.deployCommand('test', board)).rejects.toThrow(DeployError);
    });

    it('should reject boards with the wrong ship counts before saving', async () => {
        const board = createValidDeployBoard();
        board[0][0] = 'O';

        await expect(deployService.deployCommand('test', board)).rejects.toThrow(DeployError);
    });

    it('should reject malformed board dimensions before saving', async () => {
        const board = createValidDeployBoard();
        board.pop();

        await expect(deployService.deployCommand('test', board as Board)).rejects.toThrow(DeployError);
    });

    it('should save valid boards and advance deployment turn', async () => {
        const board = createValidDeployBoard();

        const gameState = await deployService.deployCommand('test', board);

        expect(gameState.players[0].board_data).toEqual(board);
        expect(gameState.phase).toBe('deploy');
        expect(gameState.active_player_index).toBe(1);
        expect(mockGameStateController.updateGame).toHaveBeenCalledTimes(1);
    });

    it('should reject non-string board markers', async () => {
        const board = createValidDeployBoard();
        board[0][0] = ['A'] as unknown as string;

        await expect(deployService.deployCommand('test', board)).rejects.toThrow(DeployError);
    });
});
