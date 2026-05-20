import type { Board, GameState } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { GameStateController } from "../gameState.ts";
import createShips from "../../common/util/createShips.ts";
import TurnManager from "./TurnManager.ts";

const EXPECTED_SHIP_COUNTS = new Map(createShips().map((ship) => [ship.key, ship.size]));
const turnManager = new TurnManager();

export default class DeployService {
    private gameStateController: GameStateController
    constructor(gameStateController: GameStateController) {
        this.gameStateController = gameStateController;
    }

    private isValidBoard(board: unknown): board is Board {
        if (!Array.isArray(board) || board.length !== 10) {
            return false;
        }
        const shipCounts = new Map<string, number>();
        for (let i = 0; i < 10; i++) {
            if (!Array.isArray(board[i]) || board[i].length !== 10) {
                return false;
            }
            for (let j = 0; j < 10; j++) {
                if (board[i][j] !== 'O') {
                    const shipSize = EXPECTED_SHIP_COUNTS.get(board[i][j]);
                    if (!shipSize) {
                        return false;
                    }
                    shipCounts.set(board[i][j], (shipCounts.get(board[i][j]) ?? 0) + 1);
                }
            }
        }

        for (const [shipKey, shipSize] of EXPECTED_SHIP_COUNTS) {
            if ((shipCounts.get(shipKey) ?? 0) !== shipSize) {
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