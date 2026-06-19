import type { Board, GameState } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { GameStateController } from "../gameState.ts";
import TurnManager from "./TurnManager.ts";

const turnManager: TurnManager = new TurnManager();
const expectedShipCells = new Map<string, number>([
    ["A", 5],
    ["B", 4],
    ["C", 3],
    ["S", 3],
    ["D", 2]
]);

export default class DeployService {
    private gameStateController: GameStateController
    constructor(gameStateController: GameStateController) {
        this.gameStateController = gameStateController;
    }

    private isValidBoard(board: Board): boolean {
        if (!Array.isArray(board) || board.length !== 10) {
            return false;
        }
        const remainingShipCells = new Map(expectedShipCells);
        for (let i = 0; i < 10; i++) {
            if (!Array.isArray(board[i]) || board[i].length !== 10) {
                return false;
            }
            for (let j = 0; j < 10; j++) {
                const cell = board[i][j];
                if (cell === 'O') {
                    continue;
                }
                const remainingCount = remainingShipCells.get(cell);
                if (remainingCount === undefined || remainingCount === 0) {
                    return false;
                }
                remainingShipCells.set(cell, remainingCount - 1);
            }
        }
        return [...remainingShipCells.values()].every((count) => count === 0);
    }
    public async deployCommand(gameID: string, deployBoard: Board): Promise<GameState> {
        if (!this.isValidBoard(deployBoard)) {
            throw new DeployError({
                message: 'Invalid board submitted'
            })
        }
        return await this.gameStateController.updateGame(gameID, async (gameState) => {
            gameState.players[gameState.active_player_index].board_data = deployBoard;
            return turnManager.endTurnDeployPhase(gameState);
        });
    }
}