import type { Board, GameState } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { GameStateController } from "../gameState.ts";
import TurnManager from "./TurnManager.ts";

const EXPECTED_SHIP_MARKER_COUNTS: Record<string, number> = {
    A: 5,
    B: 4,
    C: 3,
    S: 3,
    D: 2
};
const turnManager: TurnManager = new TurnManager();

export default class DeployService {
    private gameStateController: GameStateController
    constructor(gameStateController: GameStateController) {
        this.gameStateController = gameStateController;
    }

    private isValidBoard(board: unknown): board is Board {
        if (!Array.isArray(board) || board.length !== 10) {
            return false;
        }
        const markerCounts: Record<string, number> = {
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
                if (!Object.prototype.hasOwnProperty.call(markerCounts, marker)) {
                    return false;
                }
                markerCounts[marker] += 1;
            }
        }
        return Object.entries(EXPECTED_SHIP_MARKER_COUNTS)
            .every(([marker, expectedCount]) => markerCounts[marker] === expectedCount);
    }
    public async deployCommand(gameID: string, deployBoard: Board): Promise<GameState> {
        if (!this.isValidBoard(deployBoard)) {
            throw new DeployError({
                message: 'Invalid board submitted'
            })
        }
        return this.gameStateController.updateGame(gameID, (gameState) => {
            gameState.players[gameState.active_player_index].board_data = deployBoard;
            return turnManager.endTurnDeployPhase(gameState);
        });
    }
}