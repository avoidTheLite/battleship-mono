import type { Board, GameState } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import TurnManager from "./TurnManager.ts";
import type { GameStateController } from "../gameState.ts";

const turnManager = new TurnManager();
const expectedShipCounts: Record<string, number> = {
    A: 5,
    B: 4,
    C: 3,
    S: 3,
    D: 2
};

export default class DeployService {
    private gameStateController: GameStateController
    constructor(gameStateController: GameStateController) {
        this.gameStateController = gameStateController;
    }

    private isValidBoard(board: unknown): board is Board {
        if (!Array.isArray(board) || board.length !== 10) {
            return false;
        }
        const shipCounts: Record<string, number> = {
            A: 0,
            B: 0,
            C: 0,
            S: 0,
            D: 0
        };
        for (const row of board) {
            if (!Array.isArray(row) || row.length !== 10) {
                return false;
            }
            for (const cell of row) {
                if (cell === 'O') {
                    continue;
                }
                if (typeof cell !== 'string' || !(cell in expectedShipCounts)) {
                    return false;
                }
                shipCounts[cell] += 1;
            }
        }
        return Object.keys(expectedShipCounts).every((key) => shipCounts[key] === expectedShipCounts[key]);
    }
    public async deployCommand(gameID: string, deployBoard: Board): Promise<GameState> {
        return this.gameStateController.updateGame(gameID, (gameState) => {
            if (!this.isValidBoard(deployBoard)) {
                throw new DeployError({
                    message: 'Invalid board submitted'
                })
            }
            gameState.players[gameState.active_player_index].board_data = deployBoard;

            return turnManager.endTurnDeployPhase(gameState);
        });
    }
}