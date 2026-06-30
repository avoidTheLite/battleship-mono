import type { Board, GameState } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { GameStateController } from "../gameState.ts";
import TurnManager from "./TurnManager.ts";

const EXPECTED_SHIP_COUNTS: Record<string, number> = {
    A: 5,
    B: 4,
    C: 3,
    S: 3,
    D: 2
};
const turnManager = new TurnManager();

export default class DeployService {
    private gameStateController: GameStateController
    constructor(gameStateController: GameStateController) {
        this.gameStateController = gameStateController;
    }

    private isValidBoard(board: Board): boolean {
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
        for (let i = 0; i < 10; i++) {
            if (!Array.isArray(board[i]) || board[i].length !== 10) {
                return false;
            }
            for (let j = 0; j < 10; j++) {
                const marker = board[i][j];
                if (marker === 'O') {
                    continue;
                }
                if (!(marker in shipCounts)) {
                    return false;
                }
                shipCounts[marker] += 1;
            }
        }
        for (const [shipKey, expectedCount] of Object.entries(EXPECTED_SHIP_COUNTS)) {
            if (shipCounts[shipKey] !== expectedCount) {
                return false;
            }
        }
        return true;
    }
    public async deployCommand(gameID: string, deployBoard: Board): Promise<GameState> {
        return this.gameStateController.updateGame(gameID, (gameState: GameState) => {
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