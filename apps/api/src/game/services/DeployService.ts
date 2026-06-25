import type { Board, GameState } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import createShips from "../../common/util/createShips.ts";
import type { GameStateController } from "../gameState.ts";
import TurnManager from "./TurnManager.ts";

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

        const expectedCounts = new Map(
            createShips().map((ship) => [ship.key, ship.size])
        );
        const actualCounts = new Map(
            createShips().map((ship) => [ship.key, 0])
        );

        for (const row of board) {
            if (!Array.isArray(row) || row.length !== 10) {
                return false;
            }
            for (const cell of row) {
                if (cell === 'O') {
                    continue;
                }
                if (!expectedCounts.has(cell)) {
                    return false;
                }
                actualCounts.set(cell, (actualCounts.get(cell) ?? 0) + 1);
            }
        }

        for (const [shipKey, expectedCount] of expectedCounts.entries()) {
            if (actualCounts.get(shipKey) !== expectedCount) {
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