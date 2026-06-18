import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import createTestGame from "../../common/util/test/createTestGame.ts";
import type { Board, GameState } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import DeployService from "./DeployService.ts";

function validDeployBoard(): Board {
    return [
        ["A", "A", "A", "A", "A", "O", "O", "D", "D", "O"],
        ["O", "O", "O", "O", "O", "O", "O", "O", "O", "O"],
        ["O", "O", "O", "O", "O", "O", "O", "O", "O", "O"],
        ["O", "O", "O", "O", "O", "O", "O", "O", "O", "O"],
        ["O", "O", "O", "O", "O", "O", "O", "O", "O", "O"],
        ["O", "O", "B", "O", "O", "O", "O", "O", "C", "O"],
        ["O", "O", "B", "O", "O", "O", "O", "O", "C", "O"],
        ["O", "O", "B", "O", "O", "O", "O", "O", "C", "O"],
        ["O", "O", "B", "O", "O", "O", "O", "O", "O", "O"],
        ["O", "O", "O", "O", "O", "S", "S", "S", "O", "O"]
    ];
}

describe("DeployService", () => {
    let mockGameStateController: any;
    let deployService: DeployService;

    beforeEach(() => {
        mockGameStateController = {
            getGame: jest.fn(),
            saveGame: jest.fn()
        };
        deployService = new DeployService(mockGameStateController);
    });

    test("rejects deploy boards with non-ship markers", async () => {
        const gameState: GameState = createTestGame();
        const invalidBoard = validDeployBoard();
        invalidBoard[0][0] = "X";
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand("test", invalidBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    test("rejects malformed deploy board shape", async () => {
        const gameState: GameState = createTestGame();
        const invalidBoard = validDeployBoard().slice(0, 9) as Board;
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand("test", invalidBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    test("accepts boards with exactly the expected ship counts", async () => {
        const gameState: GameState = createTestGame();
        const deployBoard = validDeployBoard();
        mockGameStateController.getGame
            .mockResolvedValueOnce(gameState)
            .mockImplementation(() => Promise.resolve(gameState));
        mockGameStateController.saveGame.mockImplementation((_gameID: string, savedGameState: GameState) => {
            Object.assign(gameState, savedGameState);
            return Promise.resolve(savedGameState);
        });

        const result = await deployService.deployCommand("test", deployBoard);

        expect(result.players[0].board_data).toBe(deployBoard);
        expect(result.active_player_index).toBe(1);
        expect(result.phase).toBe("deploy");
    });
});
