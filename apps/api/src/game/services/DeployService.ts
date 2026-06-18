import type { Board, GameState } from "../../common/types/types.ts";
import { DeployError } from "../../common/types/errors.ts";
import type { GameStateController } from "../gameState.ts";
import createShips from "../../common/util/createShips.ts";
import TurnManager from "./TurnManager.ts";

const turnManager = new TurnManager();
const expectedShipCounts = createShips().reduce<Record<string, number>>((counts, ship) => {
    counts[ship.key] = ship.size;
    return counts;
}, {});

export default class DeployService {
    private gameStateController: GameStateController
    constructor(gameStateController: GameStateController) {
        this.gameStateController = gameStateController;
    }

    private isValidBoard(board: Board): boolean {
        if (!Array.isArray(board) || board.length !== 10) {
            return false;
        }
        const shipCounts = Object.fromEntries(
            Object.keys(expectedShipCounts).map((shipKey) => [shipKey, 0])
        ) as Record<string, number>;
        for (const row of board) {
            if (!Array.isArray(row) || row.length !== 10) {
                return false;
            }
            for (const cell of row) {
                if (cell === 'O') {
                    continue;
                }
                if (!(cell in shipCounts)) {
                    return false;
                }
                shipCounts[cell] += 1;
            }
        }
        return Object.entries(expectedShipCounts).every(([shipKey, count]) => shipCounts[shipKey] === count);
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