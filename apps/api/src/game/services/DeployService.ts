import type { Board, GameState } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import { turnManager } from "../gameState.ts";
import { GameStateController } from "../gameState.ts";

const EXPECTED_SHIP_COUNTS = {
    A: 5,
    B: 4,
    C: 3,
    S: 3,
    D: 2
} as const;

export default class DeployService {
    private gameStateController: GameStateController
    constructor(gameStateController: GameStateController) {
        this.gameStateController = gameStateController;
    }

    private isValidBoard(board: Board): boolean {
        if (!Array.isArray(board) || board.length !== 10) {
            return false;
        }

        const shipCounts: Record<keyof typeof EXPECTED_SHIP_COUNTS, number> = {
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
                const cell = board[i][j];
                if (cell === 'O') {
                    continue;
                }
                if (!(cell in EXPECTED_SHIP_COUNTS)) {
                    return false;
                }
                shipCounts[cell as keyof typeof EXPECTED_SHIP_COUNTS] += 1;
            }
        }

        for (const shipKey of Object.keys(EXPECTED_SHIP_COUNTS) as (keyof typeof EXPECTED_SHIP_COUNTS)[]) {
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