import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import DeployService from "./DeployService.ts";
import { DeployError } from "../../common/types/errors.ts";
import createBoard from "../../common/util/createBoard.ts";
import createTestGame from "../../common/util/test/createTestGame.ts";

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

    it("should reject boards with unknown ship markers", async () => {
        const gameState = createTestGame();
        const deployBoard = createBoard();

        for (let i = 0; i < 17; i++) {
            deployBoard[Math.floor(i / 10)][i % 10] = "X";
        }
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand("test", deployBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });

    it("should reject boards with incorrect ship counts", async () => {
        const gameState = createTestGame();
        const deployBoard = createBoard();

        deployBoard[0][0] = "A";
        deployBoard[0][1] = "A";
        deployBoard[0][2] = "A";
        deployBoard[0][3] = "A";
        deployBoard[0][4] = "A";
        deployBoard[1][0] = "B";
        mockGameStateController.getGame.mockResolvedValueOnce(gameState);

        await expect(deployService.deployCommand("test", deployBoard)).rejects.toThrow(DeployError);
        expect(mockGameStateController.saveGame).not.toHaveBeenCalled();
    });
});
