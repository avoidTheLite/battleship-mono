import type { Board, GameState } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { GameStateController } from "../gameState.ts";
import TurnManager from "./TurnManager.ts";

const turnManager: TurnManager = new TurnManager();
const EXPECTED_SHIP_COUNTS: Record<string, number> = {
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

        for (let i = 0; i < 10; i++) {
            if (!Array.isArray(board[i]) || board[i].length !== 10) {
                return false;
            }
            for (let j = 0; j < 10; j++) {
                const marker = board[i][j];
                if (marker === 'O') {
                    continue;
                }
                if (!Object.hasOwn(EXPECTED_SHIP_COUNTS, marker)) {
                    return false;
                }
                shipCounts[marker] += 1;
            }
        }

        for (const shipKey of Object.keys(EXPECTED_SHIP_COUNTS)) {
            if (shipCounts[shipKey] !== EXPECTED_SHIP_COUNTS[shipKey]) {
                return false;
            }
        }

        return true;
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