import type { Board, GameState } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { GameStateController } from "../gameState.ts";
import TurnManager from "./TurnManager.ts";

const turnManager: TurnManager = new TurnManager();

export default class DeployService {
    private gameStateController: GameStateController
    constructor(gameStateController: GameStateController) {
        this.gameStateController = gameStateController;
    }

    private isValidBoard(board: Board): boolean {
        if (!Array.isArray(board) || board.length !== 10) {
            return false;
        }
        const expectedCounts: Record<string, number> = {
            A: 5,
            B: 4,
            C: 3,
            S: 3,
            D: 2,
            O: 83
        };
        const counts: Record<string, number> = {
            A: 0,
            B: 0,
            C: 0,
            S: 0,
            D: 0,
            O: 0
        };
        for (let i = 0; i < 10; i++) {
            if (!Array.isArray(board[i]) || board[i].length !== 10) {
                return false;
            }
            for (let j = 0; j < 10; j++) {
                const marker = board[i][j];
                if (!(marker in expectedCounts)) {
                    return false;
                }
                counts[marker] += 1;
            }
        }
        return Object.keys(expectedCounts).every((marker) => counts[marker] === expectedCounts[marker]);
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