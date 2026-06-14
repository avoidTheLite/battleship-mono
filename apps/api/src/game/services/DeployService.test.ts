import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import DeployService from "./DeployService.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { Board, GameState } from "../../common/types/types.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";

function createValidDeployBoard(): Board {
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

describe("Deploy Service Test", () => {
    let persistedGame: GameState;
    let mockGameStateController: any;
    let deployService: DeployService;

    beforeEach(() => {
        persistedGame = createTestGame();
        mockGameStateController = {
            getGame: jest.fn(async () => persistedGame),
            saveGame: jest.fn(async (_gameID: string, gameState: GameState) => {
                persistedGame = gameState;
                return gameState;
            })
        };
        deployService = new DeployService(mockGameStateController);
    });

    it("should accept an exact valid fleet deployment", async () => {
        const deployBoard = createValidDeployBoard();

        const gameState = await deployService.deployCommand("test", deployBoard);

        expect(gameState.players[0].board_data).toBe(deployBoard);
        expect(gameState.active_player_index).toBe(1);
        expect(gameState.phase).toBe("deploy");
    });

    it("should reject unsupported markers", async () => {
        const deployBoard = createValidDeployBoard();
        deployBoard[0][0] = "X";

        await expect(deployService.deployCommand("test", deployBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it("should reject boards with the wrong ship mix", async () => {
        const deployBoard = createValidDeployBoard();
        deployBoard[0][0] = "B";

        await expect(deployService.deployCommand("test", deployBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
});
