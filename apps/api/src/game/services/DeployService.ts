import type { Board, GameState } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import TurnManager from "./TurnManager.ts";
import type { GameStateController } from "../gameState.ts";
import createShips from "../../common/util/createShips.ts";

const EXPECTED_SHIP_COUNTS = new Map(createShips().map((ship) => [ship.key, ship.size]));

export default class DeployService {
    private gameStateController: GameStateController
    private turnManager: TurnManager
    constructor(gameStateController: GameStateController) {
        this.gameStateController = gameStateController;
        this.turnManager = new TurnManager();
    }

    private isValidBoard(board: unknown): board is Board {
        if (!Array.isArray(board) || board.length !== 10) {
            return false;
        }
        const shipCounts = new Map(Array.from(EXPECTED_SHIP_COUNTS.keys()).map((key) => [key, 0]));
        for (let i = 0; i < 10; i++) {
            if (!Array.isArray(board[i]) || board[i].length !== 10) {
                return false;
            }
            for (let j = 0; j < 10; j++) {
                const cell = board[i][j];
                if (cell === 'O') {
                    continue;
                }
                if (!shipCounts.has(cell)) {
                    return false;
                }
                shipCounts.set(cell, (shipCounts.get(cell) ?? 0) + 1);
            }
        }
        return Array.from(EXPECTED_SHIP_COUNTS.entries()).every(([key, expectedCount]) => (
            shipCounts.get(key) === expectedCount
        ));
    }
    public async deployCommand(gameID: string, deployBoard: Board): Promise<GameState> {
        let gameState = await this.gameStateController.getGame(gameID);
        if (!this.isValidBoard(deployBoard)) {
            throw new DeployError({
                message: 'Invalid board submitted'
            })
        }
        gameState.players[gameState.active_player_index].board_data = deployBoard;
        
        gameState = this.turnManager.endTurnDeployPhase(gameState);
        await this.gameStateController.saveGame(gameID, gameState);
        const retrievedGameState: GameState = await this.gameStateController.getGame(gameID);
        
        return retrievedGameState;
    }
}