import type { Board, GameState } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { GameStateController } from "../gameState.ts";
import createShips from "../../common/util/createShips.ts";
import TurnManager from "./TurnManager.ts";

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
        const expectedShipCounts = new Map(createShips().map((ship) => [ship.key, ship.size]));
        const shipCounts = new Map<string, number>();
        for (let i = 0; i < 10; i++) {
            if (!Array.isArray(board[i]) || board[i].length !== 10) {
                return false;
            }
            for (let j = 0; j < 10; j++) {
                const cell = board[i][j];
                if (cell === 'O') {
                    continue;
                }
                if (typeof cell !== 'string' || !expectedShipCounts.has(cell)) {
                    return false;
                }
                shipCounts.set(cell, (shipCounts.get(cell) || 0) + 1);
            }
        }
        for (const [shipKey, expectedCount] of expectedShipCounts) {
            if (shipCounts.get(shipKey) !== expectedCount) {
                return false;
            }
        }
        return true;
    }
    public async deployCommand(gameID: string, deployBoard: unknown): Promise<GameState> {
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