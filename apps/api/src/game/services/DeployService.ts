import type { Board, GameState, ShipData } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import { turnManager } from "../gameState.ts";
import { GameStateController } from "../gameState.ts";

export default class DeployService {
    private gameStateController: GameStateController
    constructor(gameStateController: GameStateController) {
        this.gameStateController = gameStateController;
    }

    private isValidBoard(board: unknown, shipData: ShipData): board is Board {
        if (!Array.isArray(board) || board.length !== 10) {
            return false;
        }
        const shipCounts = new Map<string, number>(
            shipData.map((ship) => [ship.key, 0])
        );
        for (let i = 0; i < 10; i++) {
            if (!Array.isArray(board[i]) || board[i].length !== 10) {
                return false;
            }
            for (let j = 0; j < 10; j++) {
                const cell = board[i][j];
                if (cell === 'O') {
                    continue;
                }
                if (typeof cell !== 'string' || !shipCounts.has(cell)) {
                    return false;
                }
                shipCounts.set(cell, shipCounts.get(cell)! + 1);
            }
        }
        return shipData.every((ship) => shipCounts.get(ship.key) === ship.size);
    }
    public async deployCommand(gameID: string, deployBoard: unknown): Promise<GameState> {
        let gameState = await this.gameStateController.getGame(gameID);
        if (!this.isValidBoard(deployBoard, gameState.players[gameState.active_player_index].ship_data)) {
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