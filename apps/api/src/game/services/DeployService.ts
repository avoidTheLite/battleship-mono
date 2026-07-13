import type { Board, GameState } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import TurnManager from "./TurnManager.ts";
import type { GameStateController } from "../gameState.ts";

const turnManager = new TurnManager();
const EXPECTED_MARKER_COUNTS: Record<string, number> = {
    A: 5,
    B: 4,
    C: 3,
    S: 3,
    D: 2,
    O: 83
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

        const markerCounts: Record<string, number> = {
            A: 0,
            B: 0,
            C: 0,
            S: 0,
            D: 0,
            O: 0
        };

        for (let i = 0; i < 10; i++) {
            const row = board[i];
            if (!Array.isArray(row) || row.length !== 10) {
                return false;
            }

            for (let j = 0; j < 10; j++) {
                const marker = row[j];
                if (typeof marker !== 'string' || !(marker in markerCounts)) {
                    return false;
                }
                markerCounts[marker] += 1;
            }
        }

        return Object.entries(EXPECTED_MARKER_COUNTS).every(([marker, expectedCount]) => markerCounts[marker] === expectedCount);
    }
    public async deployCommand(gameID: string, deployBoard: Board): Promise<GameState> {
        let gameState = await this.gameStateController.getGame(gameID);
        if (!this.isValidBoard(deployBoard)) {
            throw new DeployError({
                message: 'Invalid board submitted'
            })
        }
        gameState.players[gameState.active_player_index].board_data = deployBoard;
        
        gameState = turnManager.endTurnDeployPhase(gameState);
        await this.gameStateController.saveGame(gameID, gameState);
        const retrievedGameState: GameState = await this.gameStateController.getGame(gameID);
        
        return retrievedGameState;
    }
}